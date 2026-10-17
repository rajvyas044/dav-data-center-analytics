# builds webapp/data/data.js from data/raw/data_center_hybrid.csv
# run this again only if the csv changes
import pandas as pd, numpy as np, json, math
from sklearn.cluster import KMeans
from scipy.stats import pearsonr, chi2_contingency
import os
base_folder=os.path.dirname(os.path.abspath(__file__))
csv_path=os.path.join(base_folder,'..','..','data','raw','data_center_hybrid.csv')
df=pd.read_csv(csv_path)
out={}
num=['Estimated_Capacity_MW','PUE','WUE_L_per_kWh','Daily_Electricity_Usage_MWh','Daily_Water_Usage_Gallons']
cat=['Facility_Type','Cooling_System_Type','Surrounding_Water_Stress_Tier']
r=lambda x,n=3: round(float(x),n)
# overview
out['overview']=dict(rows=len(df),cols=df.shape[1],facilities=int(df.Facility_ID.nunique()),years=[int(df.Year.min()),int(df.Year.max())],
  countries=int(df.Country.nunique()),dups=int(df.duplicated().sum()))
# columns
ex=df.iloc[0]
cols=[]
for c in df.columns:
    kind='Numeric (continuous)' if c in num else ('Numeric (discrete)' if c=='Year' else ('Categorical (ordinal)' if c=='Surrounding_Water_Stress_Tier' else 'Categorical (nominal)'))
    cols.append(dict(name=c,kind=kind,example=str(ex[c]),unique=int(df[c].nunique())))
out['columns']=cols
# class balance
bal={}
for c in cat:
    vc=df[c].value_counts()
    bal[c]=dict(labels=list(vc.index),counts=[int(v) for v in vc.values],ratio=r(vc.max()/vc.min(),1))
out['balance']=bal
# uncertainty
unc=dict(city_unknown=int((df.City=='Unknown').sum()),country_unknown=int((df.Country=='Unknown').sum()),
  country_digits=int(df.Country.str.contains(r'\d',regex=True,na=False).sum()),city_digits=int(df.City.str.contains(r'\d',regex=True,na=False).sum()),
  nulls=int(df.isnull().sum().sum()))
out['uncertainty']=unc
# stats
stats=[]
for c in num:
    s=df[c]; q1,q3=s.quantile(.25),s.quantile(.75); iqr=q3-q1; lo,hi=q1-1.5*iqr,q3+1.5*iqr
    z=((s-s.mean())/s.std()).abs()>3
    mode=s.mode().iloc[0]
    stats.append(dict(name=c,min=r(s.min()),q1=r(q1),median=r(s.median()),q3=r(q3),max=r(s.max()),iqr=r(iqr),mode=r(mode),mean=r(s.mean()),
      midrange=r((s.min()+s.max())/2),lo=r(lo),hi=r(hi),iqr_n=int(((s<lo)|(s>hi)).sum()),iqr_pct=r(((s<lo)|(s>hi)).mean()*100,2),z_n=int(z.sum()),z_pct=r(z.mean()*100,2),
      std=r(s.std())))
out['stats']=stats
# histograms
hist={}
for c in ['PUE','WUE_L_per_kWh']:
    h,e=np.histogram(df[c],bins=30); hist[c]=dict(edges=[r(x) for x in e],counts=[int(x) for x in h])
for c in ['Estimated_Capacity_MW','Daily_Electricity_Usage_MWh','Daily_Water_Usage_Gallons']:
    lg=np.log10(df[c]); h,e=np.histogram(lg,bins=30); hist[c]=dict(edges=[r(10**x,2) for x in e],counts=[int(x) for x in h],log=True)
out['hist']=hist
# yearly
yr=df.groupby('Year').agg(pue=('PUE','mean'),wue=('WUE_L_per_kWh','mean'),elec=('Daily_Electricity_Usage_MWh','mean'),water=('Daily_Water_Usage_Gallons','mean'),n=('PUE','size'))
out['yearly']=[dict(year=int(i),pue=r(x.pue),wue=r(x.wue),elec=r(x.elec,1),water=r(x.water,0),n=int(x.n)) for i,x in yr.iterrows()]
# by facility type
bt=df.groupby('Facility_Type').agg(pue=('PUE','mean'),wue=('WUE_L_per_kWh','mean'),elec=('Daily_Electricity_Usage_MWh','mean'),cap=('Estimated_Capacity_MW','mean'),n=('PUE','size'))
out['by_type']=[dict(type=i,pue=r(x.pue),wue=r(x.wue),elec=r(x.elec,1),cap=r(x.cap,1),n=int(x.n)) for i,x in bt.iterrows()]
# correlation
cm=df[num].corr()
out['corr']=dict(labels=num,matrix=[[r(v,2) for v in row] for row in cm.values])
# cube for KPI: year x type x cool x stress x country(clean)
d2=df.copy()
bad=d2.Country.str.contains(r'\d',regex=True,na=False)|(d2.Country=='Unknown')
d2['ctry']=np.where(bad,'Other/Unknown',d2.Country)
top=d2[d2.ctry!='Other/Unknown'].groupby('ctry').size().sort_values(ascending=False)
topc=list(top.index[:20])
d2['ctry']=np.where(d2.ctry.isin(topc),d2.ctry,'Other/Unknown')
g=d2.groupby(['Year','Facility_Type','Cooling_System_Type','Surrounding_Water_Stress_Tier','ctry']).agg(n=('PUE','size'),pue=('PUE','sum'),wue=('WUE_L_per_kWh','sum'),elec=('Daily_Electricity_Usage_MWh','sum'),water=('Daily_Water_Usage_Gallons','sum')).reset_index()
print('cube rows',len(g))
dims=dict(year=sorted(int(x) for x in g.Year.unique()),type=sorted(g.Facility_Type.unique()),cool=sorted(g.Cooling_System_Type.unique()),stress=['Low','Medium','High'],ctry=sorted(g.ctry.unique()))
rows=[]
for _,x in g.iterrows():
    rows.append([int(x.Year),dims['type'].index(x.Facility_Type),dims['cool'].index(x.Cooling_System_Type),dims['stress'].index(x.Surrounding_Water_Stress_Tier),dims['ctry'].index(x.ctry),int(x.n),r(x.pue,3),r(x.wue,3),r(x.elec,1),r(x.water,0)])
out['cube']=dict(dims=dims,rows=rows)
# clustering
fac=df.groupby('Facility_ID').agg(pue=('PUE','mean'),wue=('WUE_L_per_kWh','mean'),cool=('Cooling_System_Type',lambda s:s.mode().iloc[0]),ftype=('Facility_Type','first'),elec=('Daily_Electricity_Usage_MWh','mean')).reset_index()
X=fac[['pue','wue']].values; mn,mx=X.min(0),X.max(0); Z=(X-mn)/(mx-mn)
rng=np.random.RandomState(1); samp=rng.choice(len(fac),5000,replace=False)
clus=dict(points=[[r(fac.pue[i],3),r(fac.wue[i],3)] for i in samp],k={})
for k in [2,3,4,5]:
    if k==3:
        init=(np.array([[1.76,2.00],[1.66,0.17],[1.42,1.97]])-mn)/(mx-mn)
        km=KMeans(n_clusters=3,init=init,n_init=1).fit(Z); lab2=km.labels_
    else:
        km=KMeans(n_clusters=k,n_init=30,random_state=0).fit(Z); lab=km.labels_
        cen=[(X[lab==j,1].mean(),X[lab==j,0].mean(),j) for j in range(k)]
        remap={t[2]:i for i,t in enumerate(sorted(cen))}
        lab2=np.array([remap[v] for v in lab])
    cl=[]
    for j in range(k):
        m=lab2==j; sub=fac[m]
        cc=sub.cool.value_counts(normalize=True)
        cl.append(dict(id=j,n=int(m.sum()),pue=r(X[m,0].mean()),wue=r(X[m,1].mean()),elec=r(sub.elec.mean(),1),cool={a:r(b*100,1) for a,b in cc.items()},types={a:r(b*100,1) for a,b in sub.ftype.value_counts(normalize=True).items()}))
    within=float(km.inertia_); tot=float(((Z-Z.mean(0))**2).sum())
    clus['k'][str(k)]=dict(labels=[int(lab2[i]) for i in samp],clusters=cl,within=r(within,2),between=r(tot-within,2))
print({k:[(c['n'],c['pue'],c['wue']) for c in v['clusters']] for k,v in clus['k'].items()})
out['cluster']=clus; out['cluster']['total']=len(fac)
# regression
x=df.Estimated_Capacity_MW.values; y=df.Daily_Electricity_Usage_MWh.values
n=len(x); xm,ym=x.mean(),y.mean(); sxx=((x-xm)**2).sum(); sxy=((x-xm)*(y-ym)).sum()
b=sxy/sxx; a=ym-b*xm
sst=((y-ym)**2).sum()
def r2(pred): return 1-((y-pred)**2).sum()/sst
p2=np.polyfit(x,y,2)
lx,ly=np.log(x),np.log(y); pb,pa=np.polyfit(lx,ly,1)
pw_pred=np.exp(pa)*x**pb
res=dict(n=n,xm=r(xm,5),ym=r(ym,5),sxx=float(sxx),sxy=float(sxy),sst=float(sst),
 linear=dict(a=r(a,4),b=r(b,4),r2=r(r2(a+b*x),5),sse=float(((y-(a+b*x))**2).sum())),
 poly=dict(c2=float(p2[0]),c1=float(p2[1]),c0=float(p2[2]),r2=r(r2(np.polyval(p2,x)),5),sse=float(((y-np.polyval(p2,x))**2).sum())),
 power=dict(ln_a=r(pa,5),b=r(pb,5),a=r(math.exp(pa),3),r2_log=r(1-((ly-(pa+pb*lx))**2).sum()/((ly-ly.mean())**2).sum(),5),r2_orig=r(r2(pw_pred),5)))
print(res)
rs=rng.choice(n,3000,replace=False)
res['points']=[[r(x[i],2),r(y[i],1)] for i in rs]
res['xmax']=r(x.max(),1)
out['regression']=res
# preprocessing
pue20=df.PUE.head(20).sort_values().reset_index(drop=True)
bins=np.array_split(pue20,4)
out['prep']=dict(sorted=[float(v) for v in pue20],smooth=[r(b.mean(),4) for b in bins],bin_sizes=[len(b) for b in bins])
p=df.PUE; 
out['prep']['norm']=[dict(pue=float(v),mm=r((v-p.min())/(p.max()-p.min()),6),z=r((v-p.mean())/p.std(),6)) for v in df.PUE.head(10)]
out['prep']['pmin']=float(p.min());out['prep']['pmax']=float(p.max());out['prep']['pmean']=r(p.mean(),5);out['prep']['pstd']=r(p.std(),5)
pr,pv=pearsonr(x,y); out['prep']['pearson']=r(pr,4)
tb=pd.crosstab(df.Facility_Type,df.Cooling_System_Type); chi,pp,dof,_=chi2_contingency(tb)
out['prep']['chi']=dict(rows=list(tb.index),cols=list(tb.columns),table=[[int(v) for v in row] for row in tb.values],chi2=r(chi,2),dof=int(dof),p=float(pp))
low,high=x.min(),x.max(); rg=high-low; place=10**math.floor(math.log10(rg)); lead=int(rg/place)
parts=5 if lead in [1,5] else (4 if lead in [2,4,8] else 3)
start=math.floor(low/place)*place; end=math.ceil(high/place)*place
edges=np.round(np.linspace(start,end,parts+1),2)
cnt=pd.cut(df.Estimated_Capacity_MW,bins=edges,include_lowest=True).value_counts().sort_index()
out['prep']['bins345']=dict(low=r(low,2),high=r(high,2),edges=[float(e) for e in edges],counts=[int(c) for c in cnt.values],parts=parts)
text=json.dumps(out,separators=(',',':'))
out_path=os.path.join(base_folder,'..','data','data.js')
open(out_path,'w').write('var D = '+text+';\n')
import os;print('wrote',out_path,os.path.getsize(out_path),'bytes')
print(out['overview'],out['uncertainty'],out['prep']['pearson'],out['prep']['bins345'])
