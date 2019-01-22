import { Component} from '@angular/core';
import {IonicPage, NavController,Content, NavParams,App } from 'ionic-angular';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { ServiceCall } from '../../providers/service-call';
import {TranslateService} from '@ngx-translate/core';
import {Subscription} from 'rxjs/Subscription';
import { Constants } from './../../providers/constants';
import { UserDataModel } from './../../providers/user-data-model';
import { LoadingController } from 'ionic-angular';
import * as $ from 'jquery';
declare var cookieMaster;
declare var window;
declare var navigator,cordova;

@IonicPage()
@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage{

  homeBrowser:any;
   pageShouldGoBack:any;
   isPageLoadedFirstTime:boolean;
   loadURL:string="";
   isExternalURLLoaded:boolean=false;
   linkedinLoginFlag:string="false";
   islinkedinLoginSuccess:boolean=false;
   subscription:Subscription;

  constructor(public navCtrl: NavController,private inAppBrow: InAppBrowser,private translate:TranslateService,public loading:LoadingController, public navParams: NavParams,private serviceCall:ServiceCall,public userModel:UserDataModel,private app:App)  {
console.log("load home.ts");
  }

 
  ionViewDidLoad()
  {
    console.log("home.ts");
    this.isPageLoadedFirstTime=true;
    let token=localStorage.getItem("token");
    if(token=="")
    {
    this.serviceCall.getToken().subscribe(data => {
      localStorage.setItem("token",data.token);   
     if(data.token!=null)
    { 
      this.openURL();
    }
    else
    {
      console.log('Server error');
    }

  
     });
    }
    else
    this.openURL();
  }

  openURL()
  {
    localStorage.setItem("isPushURLSet","false");
    let inst=this;

    let url=this.userModel.isExternalPageLoaded?localStorage.getItem("userNavURL"):Constants.baseURL;
   var target = "_blank";
 
    var options = "location=no,hidden=yes,toolbar=no,mediaPlaybackRequiresUserAction=yes,shouldPauseOnSuspend=yes";

    let  homeBrowser=this.inAppBrow.create(url, "_blank", "location=no,toolbar=no");

   inst.homeBrowser=homeBrowser;
   this.userModel.isExternalPageLoaded=false;
 

 
    homeBrowser.on('loadstart').subscribe(function(event) {
      console.log("homepage-event.url"+event.url);
      homeBrowser.executeScript({code: "(function() {$('div .native_mobile').addClass('native_mobile_loader')})()"});
      let isEngDefault=event.url.indexOf("nl/en")!=-1?localStorage.setItem("defaultLang","en"):localStorage.setItem("defaultLang","nl");
      inst.translate.setDefaultLang(localStorage.getItem("defaultLang"));
      if(event.url.indexOf("#native_login")!=-1)
      {
        if(event.url.indexOf('?pos')==-1){
          if(event.url.indexOf("destination=")!=-1)
          localStorage.setItem("userNavURL", event.url.replace("#native_login",""));               
          else
        localStorage.setItem("userNavURL", event.url.split("#native_login")[0]);               


           homeBrowser.hide();
           inst.navCtrl.push('LoginPage',{dataURL:localStorage.getItem("userNavURL")});
        }
      }
      else if(event.url.indexOf("/user/logout")!=-1)
      {
        cookieMaster.clearCookies(
          function() {
          console.log('Cookies have been cleared');
          },
          function() {
              console.log('Cookies could not be cleared');
          });
  
          inst.serviceCall.logout().subscribe(data => {
          console.log("logout-data"+data);
            });
             cookieMaster.setCookieValue(Constants.baseURL_LANG, 'is_mobile_App', 'true',
      function() {
          console.log('A cookie has been set');
      },
      function(error) {
          console.log('Error setting cookie: '+error);
      });
      cookieMaster.setCookieValue(Constants.baseURL_LANG, 'cookie-agreed', '2',
      function() {
          console.log('A cookie has been set');
      },
      function(error) {
          console.log('Error setting cooie: '+error);
      });
      console.log("logout clicked");
        localStorage.setItem("userLoggedOut","true");      
        localStorage.setItem("token",null);
        inst.app.getRootNav().setRoot('HomePage').then(() =>{
          inst.navCtrl.popToRoot();
         }); 
  
      }
      else if(event.url.indexOf("#native_register")!=-1)
      {
        if(event.url.indexOf("destination=")!=-1)
        localStorage.setItem("userNavURL", event.url.replace("#native_register",""));               
        else
        localStorage.setItem("userNavURL", event.url.split("#native_register")[0]);      

          homeBrowser.hide();
           inst.navCtrl.push('CreatePage',{dataURL:localStorage.getItem("userNavURL")});
      }

      else if(event.url.indexOf("?mobileappsetting")!=-1)
      {
        localStorage.setItem("userNavURL", event.url.replace("?mobileappsetting",""));               
        homeBrowser.hide();
        inst.navCtrl.push('SettingsPage');
      }
      else if(event.url.indexOf("#cv_upload")!=-1)
      {
        localStorage.setItem("userNavURL", event.url.replace("#cv_upload",""));               
        homeBrowser.hide();
        inst.serviceCall.openFilePicker("HomePage",inst);
      }

      else if(event.url.indexOf("#linkedin")!=-1)
      {
       // let urlToOpen=event.url.split("#linkedin?")[1];
       let urlToOpen="https://www.linkedin.com/company-beta/339092/";
      
       localStorage.setItem("userNavURL", event.url.replace("#linkedin",""));   
       homeBrowser.executeScript({code: "(function() {$('div .native_mobile').removeClass('native_mobile_loader')})()"});
            
       inst.navCtrl.push('ExternalurlsPage',{pageName:"HomePage",externalURL:urlToOpen,dataURL:"",cookieData:""});
       
      }
  
      else if(event.url.indexOf("#google+")!=-1)
      {
        //let urlToOpen=event.url.split("#viadeo?")[1];
        let urlToOpen="https://plus.google.com/+PagepersonnelNl_NL/posts";
        
        localStorage.setItem("userNavURL", event.url.replace("#google+",""));    
        homeBrowser.executeScript({code: "(function() {$('div .native_mobile').removeClass('native_mobile_loader')})()"});           
        inst.navCtrl.push('ExternalurlsPage',{pageName:"HomePage",externalURL:urlToOpen,dataURL:"",cookieData:""});
      }
  
      else if(event.url.indexOf("#twitter")!=-1)
      {
       // let urlToOpen=event.url.split("#twitter?")[1];
       let urlToOpen="https://twitter.com/PagePersonnelNL";
       
       localStorage.setItem("userNavURL", event.url.replace("#twitter",""));    
       homeBrowser.executeScript({code: "(function() {$('div .native_mobile').removeClass('native_mobile_loader')})()"});           
       inst.navCtrl.push('ExternalurlsPage',{pageName:"HomePage",externalURL:urlToOpen,dataURL:"",cookieData:""});

      }
      else if(event.url.indexOf("#facebook")!=-1)
      {
        //let urlToOpen=event.url.split("#facebook?")[1];
        let urlToOpen="https://www.facebook.com/MichaelPageUKIRE/";
       
        localStorage.setItem("userNavURL", event.url.replace("#facebook",""));  
        homeBrowser.executeScript({code: "(function() {$('div .native_mobile').removeClass('native_mobile_loader')})()"});             
        inst.navCtrl.push('ExternalurlsPage',{pageName:"HomePage",externalURL:urlToOpen,dataURL:"",cookieData:""});
      }
      else if(event.url.indexOf("#instagram")!=-1)
      {
       // let urlToOpen=event.url.split("#instagram?")[1];
       let urlToOpen="https://www.instagram.com/pagegroupfr/";
       
       localStorage.setItem("userNavURL", event.url.replace("#instagram",""));    
       homeBrowser.executeScript({code: "(function() {$('div .native_mobile').removeClass('native_mobile_loader')})()"});   
       inst.navCtrl.push('ExternalurlsPage',{pageName:"HomePage",externalURL:urlToOpen,dataURL:"",cookieData:""});
      }
  
      else if(event.url.indexOf("#youtube")!=-1)
      {
       // let urlToOpen=event.url.split("#youtube?")[1];
       let urlToOpen="https://www.youtube.com/user/PagePersonnelNL";
       localStorage.setItem("userNavURL", event.url.replace("#youtube",""));  
       homeBrowser.executeScript({code: "(function() {$('div .native_mobile').removeClass('native_mobile_loader')})()"});             
       inst.navCtrl.push('ExternalurlsPage',{pageName:"HomePage",externalURL:urlToOpen,dataURL:"",cookieData:""});
      }

      else if(event.url.indexOf("#michaelpage")!=-1)
      {
       let urlToOpen=Constants.michaelpage_EXTERNAL_URL;
       localStorage.setItem("userNavURL", event.url.replace("#michaelpage",""));  
       homeBrowser.executeScript({code: "(function() {$('div .native_mobile').removeClass('native_mobile_loader')})()"});             
       inst.navCtrl.push('ExternalurlsPage',{pageName:"HomePage",externalURL:urlToOpen,dataURL:"",cookieData:""});
      }

      else if(event.url.indexOf("#interim")!=-1)
      {
       let urlToOpen=Constants.interim_EXTERNAL_URL;
       localStorage.setItem("userNavURL", event.url.replace("#interim",""));  
       homeBrowser.executeScript({code: "(function() {$('div .native_mobile').removeClass('native_mobile_loader')})()"});             
       inst.navCtrl.push('ExternalurlsPage',{pageName:"HomePage",externalURL:urlToOpen,dataURL:"",cookieData:""});
      }

      else if(event.url.indexOf("#pageexecutive")!=-1)
      {
       let urlToOpen=Constants.pageexecutive_EXTERNAL_URL;
       localStorage.setItem("userNavURL", event.url.replace("#pageexecutive",""));  
       homeBrowser.executeScript({code: "(function() {$('div .native_mobile').removeClass('native_mobile_loader')})()"});             
       inst.navCtrl.push('ExternalurlsPage',{pageName:"HomePage",externalURL:urlToOpen,dataURL:"",cookieData:""});
      }

      else if(event.url.indexOf("#pageTalent")!=-1)
      {
       let urlToOpen=Constants.pageTalent_EXTERNAL_URL;
       localStorage.setItem("userNavURL", event.url.replace("#pageTalent",""));  
       homeBrowser.executeScript({code: "(function() {$('div .native_mobile').removeClass('native_mobile_loader')})()"});             
       inst.navCtrl.push('ExternalurlsPage',{pageName:"HomePage",externalURL:urlToOpen,dataURL:"",cookieData:""});
      }
      else if(event.url.indexOf("#pageonline")!=-1)
      {
       let urlToOpen=Constants.pageonline_EXTERNAL_URL;
       localStorage.setItem("userNavURL", event.url.replace("#pageonline",""));  
       homeBrowser.executeScript({code: "(function() {$('div .native_mobile').removeClass('native_mobile_loader')})()"});             
       inst.navCtrl.push('ExternalurlsPage',{pageName:"HomePage",externalURL:urlToOpen,dataURL:"",cookieData:""});
      }
      else if(event.url.indexOf("#cvcatcher")!=-1)
      {
       let urlToOpen=Constants.cvcatcher_EXTERNAL_URL;
       localStorage.setItem("userNavURL", event.url.replace("#cvcatcher",""));  
       homeBrowser.executeScript({code: "(function() {$('div .native_mobile').removeClass('native_mobile_loader')})()"});             
       inst.navCtrl.push('ExternalurlsPage',{pageName:"HomePage",externalURL:urlToOpen,dataURL:"",cookieData:""});
      }

      else if(event.url.indexOf("#expertise")!=-1)
      {
       let urlToOpen=Constants.expertise_EXTERNAL_URL;
       localStorage.setItem("userNavURL", event.url.replace("#expertise",""));  
       homeBrowser.executeScript({code: "(function() {$('div .native_mobile').removeClass('native_mobile_loader')})()"});             
       inst.navCtrl.push('ExternalurlsPage',{pageName:"HomePage",externalURL:urlToOpen,dataURL:"",cookieData:""});
      }
      else if(event.url.indexOf("#pagegroup")!=-1)
      {
       let urlToOpen=Constants.pagegroup_EXTERNAL_URL;
       localStorage.setItem("userNavURL", event.url.replace("#pagegroup",""));  
       homeBrowser.executeScript({code: "(function() {$('div .native_mobile').removeClass('native_mobile_loader')})()"});             
       inst.navCtrl.push('ExternalurlsPage',{pageName:"HomePage",externalURL:urlToOpen,dataURL:"",cookieData:""});
      }
      else if(event.url.indexOf("#investisseurs")!=-1)
      {
       let urlToOpen=Constants.investisseurs_EXTERNAL_URL;
       localStorage.setItem("userNavURL", event.url.replace("#investisseurs",""));  
       homeBrowser.executeScript({code: "(function() {$('div .native_mobile').removeClass('native_mobile_loader')})()"});             
       inst.navCtrl.push('ExternalurlsPage',{pageName:"HomePage",externalURL:urlToOpen,dataURL:"",cookieData:""});
      }
      else if(event.url.indexOf("/job-apply/")!=-1)
      {
        if(this.islinkedinLoginSuccess)
        {
          console.log("If block - islinkedinLoginSuccess"+this.islinkedinLoginSuccess);
          this.linkedinLoginFlag = "true";
        } 
        else
        {
          console.log("Else block - islinkedinLoginSuccess"+this.islinkedinLoginSuccess);
          this.linkedinLoginFlag = "false";
        } 
       console.log("Jobs Apply Home Page: "+event.url+" And login Flag"+this.linkedinLoginFlag);
       localStorage.setItem("jobApplyURL", event.url);  
       localStorage.setItem("linkedinLoginSuccess",this.linkedinLoginFlag);
      }
      else if(event.url.indexOf("linkedin.com/uas")!=-1)
      {
        console.log("loadstart LINKEDIN`");
      }
      else{
        console.log("home - loadstart else part");
      }
     


    });
    homeBrowser.on('loadstop').subscribe(function(event) {
      debugger;

      console.log("load stop - homepage-event.url"+event.url);
      if(event.url.indexOf("#native_login")!=-1)
      {
        localStorage.setItem("userNavURL", event.url.split("#native_login")[0]);      
        console.log("native_login");
        homeBrowser.hide();
      }
      else if(event.url.indexOf("#native_register")!=-1)
      {
        localStorage.setItem("userNavURL",event.url.split("#native_register")[0]);         

        console.log("native_register");
        homeBrowser.hide();

      }
      else if(event.url.indexOf("/user/logout")!=-1)
      {
        cookieMaster.clearCookies(
          function() {
          console.log('Cookies have been cleared');
          },
          function() {
              console.log('Cookies could not be cleared');
          });
  
          inst.serviceCall.logout().subscribe(data => {
          console.log("logout-data"+data);
            });
             cookieMaster.setCookieValue(Constants.baseURL_LANG, 'is_mobile_App', 'true',
      function() {
          console.log('A cookie has been set');
      },
      function(error) {
          console.log('Error setting cookie: '+error);
      });
      cookieMaster.setCookieValue(Constants.baseURL_LANG, 'cookie-agreed', '2',
      function() {
          console.log('A cookie has been set');
      },
      function(error) {
          console.log('Error setting cooie: '+error);
      });
      console.log("logout clicked");
        localStorage.setItem("userLoggedOut","true");      
        localStorage.setItem("token",null);
        inst.app.getRootNav().setRoot('HomePage').then(() =>{
          inst.navCtrl.popToRoot();
         }); 
  
      }
      else if(event.url.indexOf("?mobileappsetting")!=-1)
      {
        localStorage.setItem("userNavURL", event.url.replace("?mobileappsetting",""));               
      }

      else if(event.url.indexOf("user/logout")!=-1)
    {
    
    console.log("logout clicked");
      localStorage.setItem("userLoggedOut","true");      
      localStorage.setItem("token",null);
    }
      else if(event.url.indexOf("mypage")!=-1 )
      {
        let isUserNotLoggedIN=(localStorage.getItem("userLoggedOut")==null||undefined)?true:localStorage.getItem("userLoggedOut")=="true"?true:false;
        
        if(isUserNotLoggedIN)
        {
          homeBrowser.hide();              
         // window.history.back();          
          inst.navCtrl.push('LoginPage',{dataURL:localStorage.getItem("userNavURL")});
         
        }
        else{
          let dataObj=JSON.parse(localStorage.getItem("cookieData"));                
          inst.navCtrl.push('MainPage',{data:dataObj,dataURL:localStorage.getItem("userNavURL")});
        }
       
        // browser.executeScript({code: "(function() { var aTag=document.createElement('a'); aTag.setAttribute('href','?mobileappsetting');aTag.innerHTML = 'Manage Mobile App Settings';$('#hybrid-mobile-app-settings h2').append(aTag);$('#hybrid-mobile-app-settings').css('display', 'block');$('#hybrid-mobile-app-settings').on('click',function(){console.log('div clicked');})})()"});      
      }
      else if(event.url.indexOf("linkedin.com/uas/js/xdrpc.html")!=-1 )
      {
        console.log("Home Page load Stop: xdrpc.html"+ localStorage.getItem("jobApplyURL"));
        //inst.navCtrl.push('HomePage',{dataURL:localStorage.getItem("jobApplyURL")});
        this.linkedinLoginFlag = "true";
        this.islinkedinLoginSuccess = true;
        localStorage.setItem("linkedinLoginSuccess",this.linkedinLoginFlag);
        console.log("Redirect- linkedin Login Flag"+localStorage.getItem("linkedinLoginSuccess"));
        homeBrowser.executeScript({code: "window.location = '"+localStorage.getItem("jobApplyURL")+"';"});
      }
      else if(event.url.indexOf("linkedin.com/feed/")!=-1 )
      {
        console.log("Home Page load Stop: linkedin.com/feed/: "+ localStorage.getItem("jobApplyURL"));
        let rediredctToJobApply = setTimeout( () => {
          console.log("calling after 3sec: "+window.location.href);
          homeBrowser.executeScript({code: "window.location = '"+localStorage.getItem("jobApplyURL")+"';"});
        }, 3000);
        console.log("execution done");
        this.islinkedinLoginSuccess=true;
      }
      else if(event.url.indexOf("linkedin.com/checkpoint/rp/request-password-reset-submit")!=-1 )
      {
        console.log("Forget password window.location: "+window.location.href);
        console.log("Home Page load Stop: linkedin.com/checkpoint/: "+ localStorage.getItem("jobApplyURL"));
        let rediredctToJobApply = setTimeout( () => {
          homeBrowser.executeScript({code: "window.location = '"+localStorage.getItem("jobApplyURL")+"';"});
        }, 5000);
       
      }
      else
      {       
        homeBrowser.show();
        localStorage.setItem("userNavURL",event.url);
      }
      console.log("Before If Block - linkedin Login Flag"+localStorage.getItem("linkedinLoginSuccess")+ "this.islinkedinLoginSuccess: "+this.islinkedinLoginSuccess);
      if(localStorage.getItem("linkedinLoginSuccess")=="true")
      {
        console.log("if block - linkedin Login Flag"+localStorage.getItem("linkedinLoginSuccess"));
        homeBrowser.executeScript({code: "(function() {$('.linkedin-form-apply a').click()})()"});
        this.islinkedinLoginSuccess = false;
      }
      homeBrowser.executeScript({code: "(function() {$('div .native_mobile').removeClass('native_mobile_loader')})()"});
      if(inst.isPageLoadedFirstTime)
      {
        homeBrowser.executeScript({code: "(function() {var referrer = document.referrer; if(referrer.length < 1) {$('.back, .forward').prop('onclick',null).off('click').addClass('disabled');}})()"});
        inst.isPageLoadedFirstTime=false;
      }

    });
 

  cookieMaster.setCookieValue(Constants.baseURL_LANG, 'cookie-agreed', '2',
  function() {
      console.log('A cookie has been set');
  },
  function(error) {
      console.log('Error setting cookie: '+error);
  });
  }



  

  ionViewWillEnter()
  {

    let inst=this;
    this.subscription=this.userModel.notifyObservable$.subscribe((res)=>{
      if(res.hasOwnProperty('option') && res.option==='mainPageRootSet')
      {
          inst.homeBrowser.close();
      }
    });
   if(this.homeBrowser!=undefined||this.homeBrowser!=null)
   {
     console.log("browser"+this.homeBrowser);
     this.homeBrowser.show();
     this.homeBrowser.executeScript({code: "(function() {$('div .native_mobile').removeClass('native_mobile_loader')})()"});  
     
   }

  


  }


}
