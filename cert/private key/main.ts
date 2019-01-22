/**
 * @file File containing logic to open pagepersonnel within inappbrowser after user is logged in.
 * @author Bhuvaneswari Krishnan  <bhuvaneswari.krishnan@capgemini.com>
 */
import { Component} from '@angular/core';
import { IonicPage,Platform, NavController,AlertController, NavParams,App } from 'ionic-angular';
import { Subscription } from 'rxjs';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { ServiceCall } from '../../providers/service-call';
import { Constants } from './../../providers/constants'
import { UserDataModel } from './../../providers/user-data-model';
import {TranslateService} from '@ngx-translate/core';

//common declaration variables
declare var navigator,cordova;
declare var window;
declare var cookieMaster;

/**
 * Generated class for the MainPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-main',
  templateUrl: 'main.html',
})
export class MainPage{

   cookieObj:any;
   dataURL:any;
   mainPageBrowser:any;
   isPageLoadedFirstTime:boolean;
   fileBase64Data:any;
   isMobileAppSettingsOpened:boolean=false;
   linkedinLoginFlag:string="false";
   islinkedinLoginSuccess:boolean=false;

  constructor(public navCtrl: NavController,private alertCtrl:AlertController, private platform:Platform,private inAppbrow: InAppBrowser,public navParams: NavParams,private serviceCall:ServiceCall,private app:App,private userModel:UserDataModel,private translate:TranslateService) {
    //getting cookiedata passed to page via navParams
    this.cookieObj=this.navParams.get('data');

    console.log("Constants url-"+Constants.baseURL_LANG+"/en");
    console.log((localStorage.getItem("userNavURL")==Constants.baseURL_LANG+"en"));
    console.log((localStorage.getItem("userNavURL")==Constants.baseURL));
    //re-direct if the user is logging for first time,my page should be loaded first and other appropriate page urls in rest of the cases
    if((localStorage.getItem("userNavURL")==Constants.baseURL_LANG+"en")|| (localStorage.getItem("userNavURL")==Constants.baseURL_LANG) && !this.userModel.isExternalPageLoaded)
    {

      //this.dataURL = localStorage.getItem("defaultLang") == 'en' ? Constants.REGISTER_URL_EN : Constants.REGISTER_URL;
      this.dataURL = localStorage.getItem("defaultLang") == 'en' ? Constants.baseURL_LANG+"en/mypage/profile" : Constants.baseURL_LANG+"mypage/profile";
      //this.dataURL=Constants.baseURL+"mypage/profile";

    }  
    //this.dataURL=Constants.baseURL+"mypage/profile";
    else
    this.dataURL=localStorage.getItem("userNavURL"); 
    
  }



  //Setting FCM Token after user is logged in
  
   setFCMToken()
  {
    //logic to check if fcm token is already to registered to server
    let isTokenAlreadySet=(localStorage.getItem("fcmtokenset")==null||undefined)?false:localStorage.getItem("fcmtokenset")=="true"?true:false;
    if(!isTokenAlreadySet)
    {
      let inputParams={
        email:localStorage.getItem("emailID"),
        device_id:localStorage.getItem("fcmtoken")
      };
      this.serviceCall.registerFCMToken(inputParams).subscribe(data => {
        console.log("FCMToken-Reg"+JSON.stringify(data));
        localStorage.setItem("FCMTokenSet",JSON.stringify(data));

      });
    }
  }


  //Opening Main Page InappBrowser after user logged in
  openMainURL()
  {
    let cookieData=this.cookieObj;    
    let inst=this;
    //setting cookie data to approp variabled
    let cookie2Val=cookieData.cookieDataVal2;
    cookieData.cookieDataVal1=cookieData.cookieDataVal1==null?cookie2Val:cookieData.cookieDataVal1;
    let url=Constants.baseURL;
    //Inappbrowser creation and initially hide the browser till the page is fully loaded
    let mainPageBrowser = this.inAppbrow.create(inst.dataURL, "_blank", "location=no,toolbar=no,mediaPlaybackRequiresUserAction=yes,shouldPauseOnSuspend=yes");
    this.mainPageBrowser=mainPageBrowser;    
    mainPageBrowser.hide();
     let isUserLoggedIN=(localStorage.getItem("token")==null||undefined)?false:true;
     //function call to set cookie data
    this.setCookieData(isUserLoggedIN,cookieData);
    this.userModel.isExternalPageLoaded=false;
     
    /*InappBrowser loadtstart event handling
    * In ios handling urls can be done only in load start to work but in android this behavior is different
    * */

  mainPageBrowser.on('loadstart').subscribe(function(event) {
    console.log("mainpage loadstart -event.url"+event.url);
    let isEngDefault=event.url.indexOf("nl/en")!=-1?localStorage.setItem("defaultLang","en"):localStorage.setItem("defaultLang","nl");
    inst.translate.setDefaultLang(localStorage.getItem("defaultLang"));

    //executiong script for showing loader within web page
    mainPageBrowser.executeScript({code: "(function() {$('div .native_mobile').addClass('native_mobile_loader')})()"});

    //local storage userNavURL will contain the current url which was opened without customized any hash values

    /*logic to handle if the login is clicked within webpage.All login clicks will have #value as native_login
     * Whenever this keyword is encountered instead of opening webpage ,native login screen login.ts needs to be opened
     * */
    if(event.url.indexOf("#native_login")!=-1)
    {
      if(event.url.indexOf('?pos')==-1){
        if(event.url.indexOf("destination=")!=-1)
        localStorage.setItem("userNavURL", event.url.replace("#native_login",""));               
        else
      localStorage.setItem("userNavURL",event.url.split("#native_login")[0]);     
      
      //hide inappbrowser before opening any native page since always inappbrowser will be on top even after navigating to a native page
       mainPageBrowser.hide();
      
      /*opening login screen,sending the current url where user has traversed since
      * user needs to be redirected to the same after login success
      * */
      inst.navCtrl.push('LoginPage',{dataURL:localStorage.getItem("userNavURL")});
      }
    }

    /*logic for handling logout.Logout rest api call needs to be called and all session cookies need to be cleared.
      URL will be /user/logout whenever logout is clicked in webpage
    */

    else if(event.url.indexOf("/user/logout")!=-1)
    {

      //clearing session cookies
      cookieMaster.clearCookies(
        function() {
        console.log('Cookies have been cleared');
        },
        function() {
            console.log('Cookies could not be cleared');
        });
      
      //rest api function call for logout
        inst.serviceCall.logout().subscribe(data => {
        console.log("logout-data"+data);
          });
      //resetting cookies after logout except session cookies
      cookieMaster.setCookieValue(Constants.baseURL_LANG, 'is_mobile_App', 'true',
        function() {
            console.log('cookie for isMobileApp identification is set');
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
      mainPageBrowser.executeScript({code: "(function() {$('.back, .forward').prop('onclick',null).off('click').addClass('disabled');})()"});
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
      mainPageBrowser.hide();     

         inst.navCtrl.push('CreatePage',{dataURL:localStorage.getItem("userNavURL")});
    }

    else if(event.url.indexOf("#cv_upload")!=-1)
    {
      localStorage.setItem("userNavURL", event.url.replace("#cv_upload",""));               
      mainPageBrowser.hide();
      inst.serviceCall.openFilePicker("MainPage",inst);
    }

    else if(event.url.indexOf("?mobileappsetting")!=-1)
    {
      mainPageBrowser.hide();
      inst.isMobileAppSettingsOpened=true;
      localStorage.setItem("userNavURL", event.url.replace("?mobileappsetting",""));               

      inst.navCtrl.push('SettingsPage');
    }

    else if(event.url.indexOf("#linkedin")!=-1)
    {
     // let urlToOpen=event.url.split("#linkedin?")[1];
     let urlToOpen="https://www.linkedin.com/company-beta/339092/";
    
     localStorage.setItem("userNavURL", event.url.replace("#linkedin",""));   
     mainPageBrowser.executeScript({code: "(function() {$('div .native_mobile').removeClass('native_mobile_loader')})()"});
          
     inst.navCtrl.push('ExternalurlsPage',{pageName:"MainPage",externalURL:urlToOpen,dataURL:localStorage.getItem("userNavURL"),cookieData:inst.cookieObj});
     
    }

    else if(event.url.indexOf("#google+")!=-1)
    {
      //let urlToOpen=event.url.split("#viadeo?")[1];
      let urlToOpen="https://plus.google.com/+PagepersonnelNl_NL/posts";
      
      localStorage.setItem("userNavURL", event.url.replace("#google+",""));    
      mainPageBrowser.executeScript({code: "(function() {$('div .native_mobile').removeClass('native_mobile_loader')})()"});           
      inst.navCtrl.push('ExternalurlsPage',{pageName:"MainPage",externalURL:urlToOpen,dataURL:localStorage.getItem("userNavURL"),cookieData:inst.cookieObj});
    }

    else if(event.url.indexOf("#twitter")!=-1)
    {
     // let urlToOpen=event.url.split("#twitter?")[1];
     let urlToOpen="https://twitter.com/PagePersonnelNL";
     
     localStorage.setItem("userNavURL", event.url.replace("#twitter",""));    
     mainPageBrowser.executeScript({code: "(function() {$('div .native_mobile').removeClass('native_mobile_loader')})()"});           
     inst.navCtrl.push('ExternalurlsPage',{pageName:"MainPage",externalURL:urlToOpen,dataURL:localStorage.getItem("userNavURL"),cookieData:inst.cookieObj});

    }
    else if(event.url.indexOf("#facebook")!=-1)
    {
      //let urlToOpen=event.url.split("#facebook?")[1];
      let urlToOpen="https://www.facebook.com/MichaelPageUKIRE/";
     
      localStorage.setItem("userNavURL", event.url.replace("#facebook",""));  
      mainPageBrowser.executeScript({code: "(function() {$('div .native_mobile').removeClass('native_mobile_loader')})()"});             
      inst.navCtrl.push('ExternalurlsPage',{pageName:"MainPage",externalURL:urlToOpen,dataURL:localStorage.getItem("userNavURL"),cookieData:inst.cookieObj});
    }
    else if(event.url.indexOf("#instagram")!=-1)
    {
     // let urlToOpen=event.url.split("#instagram?")[1];
     let urlToOpen="https://www.instagram.com/pagegroupfr/";
     
     localStorage.setItem("userNavURL", event.url.replace("#instagram",""));    
     mainPageBrowser.executeScript({code: "(function() {$('div .native_mobile').removeClass('native_mobile_loader')})()"});   
     inst.navCtrl.push('ExternalurlsPage',{pageName:"MainPage",externalURL:urlToOpen,dataURL:localStorage.getItem("userNavURL"),cookieData:inst.cookieObj});
    }

    else if(event.url.indexOf("#youtube")!=-1)
    {
     // let urlToOpen=event.url.split("#youtube?")[1];
     let urlToOpen="https://www.youtube.com/user/PagePersonnelNL";
     localStorage.setItem("userNavURL", event.url.replace("#youtube",""));  
     mainPageBrowser.executeScript({code: "(function() {$('div .native_mobile').removeClass('native_mobile_loader')})()"});             
     inst.navCtrl.push('ExternalurlsPage',{pageName:"MainPage",externalURL:urlToOpen,dataURL:localStorage.getItem("userNavURL"),cookieData:inst.cookieObj});
    }


    else if(event.url.indexOf("#michaelpage")!=-1)
    {
     let urlToOpen=Constants.michaelpage_EXTERNAL_URL;
     localStorage.setItem("userNavURL", event.url.replace("#michaelpage",""));  
     mainPageBrowser.executeScript({code: "(function() {$('div .native_mobile').removeClass('native_mobile_loader')})()"});             
     inst.navCtrl.push('ExternalurlsPage',{pageName:"MainPage",externalURL:urlToOpen,dataURL:localStorage.getItem("userNavURL"),cookieData:inst.cookieObj});
    }

    else if(event.url.indexOf("#interim")!=-1)
    {
     let urlToOpen=Constants.interim_EXTERNAL_URL;
     localStorage.setItem("userNavURL", event.url.replace("#interim",""));  
     mainPageBrowser.executeScript({code: "(function() {$('div .native_mobile').removeClass('native_mobile_loader')})()"});             
     inst.navCtrl.push('ExternalurlsPage',{pageName:"MainPage",externalURL:urlToOpen,dataURL:localStorage.getItem("userNavURL"),cookieData:inst.cookieObj});
    }

    else if(event.url.indexOf("#pageexecutive")!=-1)
    {
     let urlToOpen=Constants.pageexecutive_EXTERNAL_URL;
     localStorage.setItem("userNavURL", event.url.replace("#pageexecutive",""));  
     mainPageBrowser.executeScript({code: "(function() {$('div .native_mobile').removeClass('native_mobile_loader')})()"});             
     inst.navCtrl.push('ExternalurlsPage',{pageName:"MainPage",externalURL:urlToOpen,dataURL:localStorage.getItem("userNavURL"),cookieData:inst.cookieObj});
    }

    else if(event.url.indexOf("#pageTalent")!=-1)
    {
     let urlToOpen=Constants.pageTalent_EXTERNAL_URL;
     localStorage.setItem("userNavURL", event.url.replace("#pageTalent",""));  
     mainPageBrowser.executeScript({code: "(function() {$('div .native_mobile').removeClass('native_mobile_loader')})()"});             
     inst.navCtrl.push('ExternalurlsPage',{pageName:"MainPage",externalURL:urlToOpen,dataURL:localStorage.getItem("userNavURL"),cookieData:inst.cookieObj});
    }
    else if(event.url.indexOf("#pageonline")!=-1)
    {
     let urlToOpen=Constants.pageonline_EXTERNAL_URL;
     localStorage.setItem("userNavURL", event.url.replace("#pageonline",""));  
     mainPageBrowser.executeScript({code: "(function() {$('div .native_mobile').removeClass('native_mobile_loader')})()"});             
     inst.navCtrl.push('ExternalurlsPage',{pageName:"MainPage",externalURL:urlToOpen,dataURL:localStorage.getItem("userNavURL"),cookieData:inst.cookieObj});
    }
    else if(event.url.indexOf("#cvcatcher")!=-1)
    {
     let urlToOpen=Constants.cvcatcher_EXTERNAL_URL;
     localStorage.setItem("userNavURL", event.url.replace("#cvcatcher",""));  
     mainPageBrowser.executeScript({code: "(function() {$('div .native_mobile').removeClass('native_mobile_loader')})()"});             
     inst.navCtrl.push('ExternalurlsPage',{pageName:"MainPage",externalURL:urlToOpen,dataURL:localStorage.getItem("userNavURL"),cookieData:inst.cookieObj});
    }

    else if(event.url.indexOf("#expertise")!=-1)
    {
     let urlToOpen=Constants.expertise_EXTERNAL_URL;
     localStorage.setItem("userNavURL", event.url.replace("#expertise",""));  
     mainPageBrowser.executeScript({code: "(function() {$('div .native_mobile').removeClass('native_mobile_loader')})()"});             
     inst.navCtrl.push('ExternalurlsPage',{pageName:"MainPage",externalURL:urlToOpen,dataURL:localStorage.getItem("userNavURL"),cookieData:inst.cookieObj});
    }
    else if(event.url.indexOf("#pagegroup")!=-1)
    {
     let urlToOpen=Constants.pagegroup_EXTERNAL_URL;
     localStorage.setItem("userNavURL", event.url.replace("#pagegroup",""));  
     mainPageBrowser.executeScript({code: "(function() {$('div .native_mobile').removeClass('native_mobile_loader')})()"});             
     inst.navCtrl.push('ExternalurlsPage',{pageName:"MainPage",externalURL:urlToOpen,dataURL:localStorage.getItem("userNavURL"),cookieData:inst.cookieObj});
    }
    else if(event.url.indexOf("#investisseurs")!=-1)
    {
     let urlToOpen=Constants.investisseurs_EXTERNAL_URL;
     localStorage.setItem("userNavURL", event.url.replace("#investisseurs",""));  
     mainPageBrowser.executeScript({code: "(function() {$('div .native_mobile').removeClass('native_mobile_loader')})()"});             
     inst.navCtrl.push('ExternalurlsPage',{pageName:"MainPage",externalURL:urlToOpen,dataURL:localStorage.getItem("userNavURL"),cookieData:inst.cookieObj});
    }
    else if(event.url.indexOf("/job-apply/")!=-1)
      {
        if(this.islinkedinLoginSuccess)
          this.linkedinLoginFlag = "true";
        else
          this.linkedinLoginFlag = "false";
       console.log("Jobs Apply Home Page: "+event.url+" And login Flag"+this.linkedinLoginFlag);
       localStorage.setItem("jobApplyURL", event.url);  
       localStorage.setItem("linkedinLoginSuccess",this.linkedinLoginFlag);
      }
    else{
      console.log("loadstart else part");
      mainPageBrowser.show();
    }
    mainPageBrowser.executeScript({code: "(function() {$('div .native_mobile').removeClass('native_mobile_loader')})()"});


  });
  mainPageBrowser.on('loadstop').subscribe(function(event) {
    console.log("mainpage-event.url"+event.url);

    
    if(event.url.indexOf("#native_login")!=-1)
    {
      localStorage.setItem("userNavURL",event.url.split("#native_login")[0]);        
 

      console.log("native_login");
    }
    else if(event.url.indexOf("#native_register")!=-1)
    {
      localStorage.setItem("userNavURL", event.url.split("#native_register")[0]);     

      console.log("native_register");

    }
    else if(event.url.indexOf("?mobileappsetting")!=-1)
    {
      localStorage.setItem("userNavURL", event.url.replace("?mobileappsetting",""));               

    }
    //else if(event.url.indexOf("mypage")!=-1 )
    else if((event.url.indexOf("mypage")!=-1 ) && (event.url.indexOf("mypage/saved-jobs")==-1))
    {
      let isUserNotLoggedIN=(localStorage.getItem("userLoggedOut")==null||undefined)?true:localStorage.getItem("userLoggedOut")=="true"?true:false;
      
      if(isUserNotLoggedIN)
      {
        mainPageBrowser.hide();              
       // window.history.back();          
        inst.navCtrl.push('LoginPage',{dataURL:localStorage.getItem("userNavURL")});
       
      }
      else{
        mainPageBrowser.show();

      }
     
      // browser.executeScript({code: "(function() { var aTag=document.createElement('a'); aTag.setAttribute('href','?mobileappsetting');aTag.innerHTML = 'Manage Mobile App Settings';$('#hybrid-mobile-app-settings h2').append(aTag);$('#hybrid-mobile-app-settings').css('display', 'block');$('#hybrid-mobile-app-settings').on('click',function(){console.log('div clicked');})})()"});      
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
      mainPageBrowser.executeScript({code: "(function() {$('.back, .forward').prop('onclick',null).off('click').addClass('disabled');})()"});
      inst.app.getRootNav().setRoot('HomePage').then(() =>{
        inst.navCtrl.popToRoot();
       }); 

    }
    else if(event.url.indexOf("linkedin.com/uas/js/xdrpc.html")!=-1 )
      {
        console.log("Main Page load Stop: xdrpc.html"+ localStorage.getItem("jobApplyURL"));
        //inst.navCtrl.push('HomePage',{dataURL:localStorage.getItem("jobApplyURL")});
        this.linkedinLoginFlag = "true";
        this.islinkedinLoginSuccess = true;
        localStorage.setItem("linkedinLoginSuccess",this.linkedinLoginFlag);
        console.log("Redirect- linkedin Login Flag"+localStorage.getItem("linkedinLoginSuccess"));
        mainPageBrowser.executeScript({code: "window.location = '"+localStorage.getItem("jobApplyURL")+"';"});
      }
      else if(event.url.indexOf("linkedin.com/feed/")!=-1 )
      {
        console.log("Main Page load Stop: linkedin.com/feed/: "+ localStorage.getItem("jobApplyURL"));
        let rediredctToJobApply = setTimeout( () => {
          console.log("calling after 3sec: "+window.location.href);
          mainPageBrowser.executeScript({code: "window.location = '"+localStorage.getItem("jobApplyURL")+"';"});
        }, 3000);
        console.log("execution done");
        this.islinkedinLoginSuccess=true;
      }
      else if(event.url.indexOf("linkedin.com/checkpoint/rp/request-password-reset-submit")!=-1 )
      {
        console.log("Forget password window.location: "+window.location.href);
        console.log("Main Page load Stop: linkedin.com/checkpoint/: "+ localStorage.getItem("jobApplyURL"));
        let rediredctToJobApply = setTimeout( () => {
          mainPageBrowser.executeScript({code: "window.location = '"+localStorage.getItem("jobApplyURL")+"';"});
        }, 5000);
       
      }
    else
    {
      mainPageBrowser.show();
      localStorage.setItem("userNavURL",event.url);
    }
    
    console.log("Before If Block - linkedin Login Flag"+localStorage.getItem("linkedinLoginSuccess")+ "this.islinkedinLoginSuccess: "+this.islinkedinLoginSuccess);
      if(localStorage.getItem("linkedinLoginSuccess")=="true")
      {
        console.log("if block - linkedin Login Flag"+localStorage.getItem("linkedinLoginSuccess"));
        mainPageBrowser.executeScript({code: "(function() {$('.linkedin-form-apply a').click()})()"});
        this.islinkedinLoginSuccess = false;
      }
    mainPageBrowser.executeScript({code: "(function() {$('div .native_mobile').removeClass('native_mobile_loader');})()"});


  //  if(inst.isPageLoadedFirstTime)
  //  {
  //    mainPageBrowser.executeScript({code: "(function() {$('.ios-nav-bar .back').prop('onclick',null).off('click');})()"});
  //    inst.isPageLoadedFirstTime=false;
  //  }

   

  });
  

  }

  
  setCookieData(isUserLoggedIN,cookieData)
  {
    if(isUserLoggedIN)
    {
      //debugger;
     // alert('isUserLoggedIN');
    cookieMaster.setCookieValue(Constants.baseURL_LANG, cookieData.cookieDataName1, cookieData.cookieDataVal1,
    function() {
        console.log('Sess Cookie 1 has been set');
    },
    function(error) {
        console.log('Error setting cookie: '+error);
    });
    cookieMaster.setCookieValue(Constants.baseURL_LANG, cookieData.cookieDataName2, cookieData.cookieDataVal2,
    function() {
        console.log('Sess Cookie 2 has been set');
    },
    function(error) {
        console.log('Error setting cookie: '+error);
    });
    cookieMaster.setCookieValue(Constants.baseURL_LANG, 'cookie-agreed', '2',
    function() {
        console.log('A cookie has been set');
    },
    function(error) {
        console.log('Error setting cookie: '+error);
    });
    
    }
   else{
    cookieMaster.setCookieValue(Constants.baseURL_LANG, 'cookie-agreed', '2',
    function() {
        console.log('cookie-agreed cookie has been set');
    },
    function(error) {
        console.log('Error setting cookie: '+error);
    });
    }
  }

  ionViewDidLoad() {
    debugger;
    this.isPageLoadedFirstTime=true;
    let cookieData=this.cookieObj;
    let inst=this;
    
    let token=localStorage.getItem("token");

    this.serviceCall.getToken().subscribe(data => {
          localStorage.setItem("token",data.token);   
          
      let pushValue=localStorage.getItem("isPushURLSet");
      let isPushURL=pushValue=="false"?false:true;
      console.log("isPushURL"+isPushURL);
      if(!inst.userModel.isExternalPageLoaded)
      inst.setFCMToken();   

      inst.openMainURL();
      });
   
   
   // this.openBrowser();
  }
  ionViewWillEnter()
  {
    if(this.mainPageBrowser!=undefined||this.mainPageBrowser!=null)
    {
      if(this.isMobileAppSettingsOpened)
      {
        this.mainPageBrowser.executeScript({code: "(function() {window.location.href=window.location.href.replace('?mobileappsetting','')})()"});
        this.isMobileAppSettingsOpened=false;
      }
    this.mainPageBrowser.show();
    this.mainPageBrowser.executeScript({code: "(function() {$('div .native_mobile').removeClass('native_mobile_loader')})()"});  
    }
   // alert('enter');  
    cookieMaster.setCookieValue(Constants.baseURL_LANG, 'cookie-agreed', '2',
    function() {
        console.log('A cookie has been set');
    },
    function(error) {
        console.log('Error setting cookie: '+error);
    });
  }

   



  
 


 

}
