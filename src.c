//*************************************************************************************
//SWINGBY
//[Q2]
// one-DOF vibration system
//numerical solution : forth-order Runge-kutta
//*************************************************************************************
#include<stdio.h>
#include<math.h>
#include<stdlib.h>
//*************************************************************************************
//define constant
//*************************************************************************************
#define G 6.67430e-11 //m^3/kg/s^2
#define M 5.972e24 //kg
#define GM (G*M)
#define x0 7.00e6 //m
#define y0 0.0e+3 //m
#define vx0 0.0e+3 //m/s
#define vy0 7.7e+3 //m/s
#define dt 0.1
#define tmax 200001
#define t0 0.000
//*************************************************************************************
//definition <global variables>
//*************************************************************************************
double t[tmax],x[tmax],y[tmax],v_x[tmax],v_y[tmax],r[tmax];
double k1_x[tmax],k1_y[tmax],k1_vx[tmax],k1_vy[tmax];
double k2_x[tmax],k2_y[tmax],k2_vx[tmax],k2_vy[tmax];
double x_2[tmax],y_2[tmax],v_x_2[tmax],v_y_2[tmax];
double r_2[tmax];
double x_3[tmax],y_3[tmax],v_x_3[tmax],v_y_3[tmax];
double r_3[tmax];
double x_4[tmax],y_4[tmax],v_x_4[tmax],v_y_4[tmax];
double r_4[tmax];
double k3_x[tmax],k3_y[tmax],k3_vx[tmax],k3_vy[tmax];
double k4_x[tmax],k4_y[tmax],k4_vx[tmax],k4_vy[tmax];
//*************************************************************************************
//*************************************************************************************
//definition <function>
//*************************************************************************************
void initialCondition(void);
void forthOrderRungeKutta(void);
void output_csv(void);
//*************************************************************************************
//main program
//*************************************************************************************
int main(void){
    initialCondition();
    forthOrderRungeKutta();
    output_csv();
    return 0;
}
//*************************************************************************************
//function
//*************************************************************************************
//*************************************************************************************
//initial Condition
//*************************************************************************************
void initialCondition(void){
    int i;
    for(i=0;i<tmax;i++){
        t[i]=t0+i*dt;
    }
    x[0]=x0;
    y[0]=y0;
    v_x[0]=vx0;
    v_y[0]=vy0;
}
//*****************************************************************************************
//2nd-order Runge-Kutta method
//*****************************************************************************************
void forthOrderRungeKutta(void){
    int i;
    for(i=0;i<tmax;i++){

        r[i]=sqrt(x[i]*x[i]+y[i]*y[i]);

        k1_x[i]=v_x[i];
        k1_y[i]=v_y[i];
        k1_vx[i]=-GM*x[i]/pow(r[i],3);
        k1_vy[i]=-GM*y[i]/pow(r[i],3);

        x_2[i]=x[i]+0.5*k1_x[i]*dt;
        y_2[i]=y[i]+0.5*k1_y[i]*dt;
        r_2[i]=sqrt(x_2[i]*x_2[i]+y_2[i]*y_2[i]);
        v_x_2[i]=v_x[i]+0.5*k1_vx[i]*dt;
        v_y_2[i]=v_y[i]+0.5*k1_vy[i]*dt;

        k2_x[i]=v_x_2[i];
        k2_y[i]=v_y_2[i];
        k2_vx[i]=-GM*x_2[i]/pow(r_2[i],3);
        k2_vy[i]=-GM*y_2[i]/pow(r_2[i],3);

        x_3[i]=x[i]+0.5*k2_x[i]*dt;
        y_3[i]=y[i]+0.5*k2_y[i]*dt;
        r_3[i]=sqrt(x_3[i]*x_3[i]+y_3[i]*y_3[i]);
        v_x_3[i]=v_x[i]+0.5*k2_vx[i]*dt;
        v_y_3[i]=v_y[i]+0.5*k2_vy[i]*dt;

        k3_x[i]=v_x_3[i];
        k3_y[i]=v_y_3[i];
        k3_vx[i]=-GM*x_3[i]/pow(r_3[i],3);
        k3_vy[i]=-GM*y_3[i]/pow(r_3[i],3);

        x_4[i]=x[i]+k3_x[i]*dt;
        y_4[i]=y[i]+k3_y[i]*dt;
        r_4[i]=sqrt(x_4[i]*x_4[i]+y_4[i]*y_4[i]);
        v_x_4[i]=v_x[i]+k3_vx[i]*dt;
        v_y_4[i]=v_y[i]+k3_vy[i]*dt;

        k4_x[i]=v_x_4[i];
        k4_y[i]=v_y_4[i];
        k4_vx[i]=-GM*x_4[i]/pow(r_4[i],3);
        k4_vy[i]=-GM*y_4[i]/pow(r_4[i],3);

        v_x[i+1]=v_x[i]+1.0/6.0*(k1_vx[i]+2.0*k2_vx[i]+2.0*k3_vx[i]+k4_vx[i])*dt;
        v_y[i+1]=v_y[i]+1.0/6.0*(k1_vy[i]+2.0*k2_vy[i]+2.0*k3_vy[i]+k4_vy[i])*dt;
        x[i+1]=x[i]+1.0/6.0*(k1_x[i]+2.0*k2_x[i]+2.0*k3_x[i]+k4_x[i])*dt;
        y[i+1]=y[i]+1.0/6.0*(k1_y[i]+2.0*k2_y[i]+2.0*k3_y[i]+k4_y[i])*dt;
    }
      
}

//*****************************************************************************************
//output CSV
//*****************************************************************************************
void output_csv(void){
    int i;
    FILE *ofcsv=fopen("swingby.csv","w");
    if(!ofcsv){
        perror("You cannot open this file.");
        exit(1);
    }
fprintf(ofcsv,"i,t,x,v\n");
    for(i=0;i<tmax;i++){
        fprintf(ofcsv,"%d,%f,%f,%f,%f,%f\n", i,t[i],x[i],y[i],v_x[i],v_y[i]   );
    }
    fclose(ofcsv);
}
