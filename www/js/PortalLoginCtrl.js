/* jshint -W041 */
/* jshint -W083 */
/*This is for the loop closure I am using in line 143 */
/* jslint browser: true*/
/* global vis,cordova,StatusBar,angular,console,moment */
angular.module('zmApp.controllers').controller('zmApp.PortalLoginCtrl', ['$ionicPlatform', '$scope', 'zm', 'NVRDataModel', '$ionicSideMenuDelegate', '$rootScope', '$http', '$q', '$state', '$ionicLoading', '$ionicPopover', '$ionicScrollDelegate', '$ionicModal', '$timeout', 'zmAutoLogin', '$ionicHistory', 'EventServer', '$translate', '$ionicPopup', function ($ionicPlatform, $scope, zm, NVRDataModel, $ionicSideMenuDelegate, $rootScope, $http, $q, $state, $ionicLoading, $ionicPopover, $ionicScrollDelegate, $ionicModal, $timeout, zmAutoLogin, $ionicHistory, EventServer, $translate, $ionicPopup) {

 
  var broadcastHandles = [];
  var processPush = false;
  var alreadyTransitioned = false;

  $scope.$on('$ionicView.beforeLeave', function () {
    processPush = false;
   
  });

  

  $scope.$on('$ionicView.beforeLeave', function () {
    //NVRDataModel.debug("Portal: Deregistering broadcast handles");
    for (var i = 0; i < broadcastHandles.length; i++) {
      //broadcastHandles[i]();
    }
    broadcastHandles = [];
  });


  $scope.$on('$ionicView.beforeEnter',
    function () {
      alreadyTransitioned = false;

      });


  $scope.$on('$ionicView.enter',
    function () {


      $scope.$on ( "process-push", function () {
        processPush = true;

        if (!alreadyTransitioned) {
          NVRDataModel.debug (">> PortalLogin: push handler, marking to resolve later");
        
        }
        else {
          NVRDataModel.debug (">> PortalLoginCtrl: push handler");
          processPush = false;
          var s = NVRDataModel.evaluateTappedNotification();
          NVRDataModel.debug("tapped Notification evaluation:"+ JSON.stringify(s));
          $ionicHistory.nextViewOptions({
            disableAnimate:true,
            disableBack: true
          });
          $state.go(s[0],s[1],s[2]);
          return;

        }
        
      });
    

      NVRDataModel.setJustResumed(false);

      NVRDataModel.debug("Inside Portal login Enter handler");
      loginData = NVRDataModel.getLogin();

      $ionicHistory.nextViewOptions({
        disableAnimate:true,
        disableBack: true
      });


    
      $scope.pindata = {};
      if ($ionicSideMenuDelegate.isOpen()) {
        $ionicSideMenuDelegate.toggleLeft();
        NVRDataModel.debug("Sliding menu close");
      }

      $scope.pinPrompt = false; // if true, then PIN is displayed else skip 

      if (NVRDataModel.hasLoginInfo()) {
        NVRDataModel.log("User credentials are provided");

        // You can login either via touch ID or typing in your code     

        var ld = NVRDataModel.getLogin();

        if (ld.reloadInMontage == true) {
          // we are in montage reload, so don't re-auth
          NVRDataModel.log("skipping validation, as this is montage reload");
          ld.reloadInMontage = false;
          NVRDataModel.setLogin(ld);
          unlock(true);

        } else if ($ionicPlatform.is('android') && loginData.usePin) {

          FingerprintAuth.isAvailable(function (result) {
              NVRDataModel.debug("FingerprintAuth available: " + JSON.stringify(result));
              if (result.isAvailable == true && result.hasEnrolledFingerprints == true) {
                var encryptConfig = {
                  clientId: "zmNinja",
                  username: "doesntmatter",
                  password: "doesntmatter",
                  maxAttempts: 5,
                  locale: "en_US",
                  dialogTitle: $translate.instant('kPleaseAuthenticate'),
                  dialogMessage: $translate.instant('kPleaseAuthenticate'),
                  dialogHint: "",
                }; // See config object for required parameters
                FingerprintAuth.encrypt(encryptConfig, function (succ) {
                  NVRDataModel.log("Touch success");
                  unlock(true);
                }, function (err) {
                  NVRDataModel.log("Touch Failed " + JSON.stringify(msg));
                });
              } // if available                            
            },
            function (err) {
              NVRDataModel.log("Fingerprint auth not available or not compatible with Android specs: " + JSON.stringify(err));
            }

          ); //isAvailable

        } else if ($ionicPlatform.is('ios') && loginData.usePin) {

          window.plugins.touchid.isAvailable(
            function () {
              window.plugins.touchid.verifyFingerprint(
                $translate.instant('kPleaseAuthenticate'), // this will be shown in the native scanner popup
                function (msg) {
                  NVRDataModel.log("Touch success");
                  unlock(true);
                }, // success handler: fingerprint accepted
                function (msg) {
                  NVRDataModel.log("Touch Failed " + JSON.stringify(msg));
                } // error handler with errorcode and localised reason
              );
            },
            function (err) {});

          /* $cordovaTouchID.checkSupport()
               .then(function()
               {
                   // success, TouchID supported
                   $cordovaTouchID.authenticate("")
                       .then(function()
                           {
                               NVRDataModel.log("Touch Success");
                               // Don't assign pin as it may be alphanum
                               unlock(true);

                           },
                           function()
                           {
                               NVRDataModel.log("Touch Failed");
                           });
               }, function(error)
               {
                   NVRDataModel.log("TouchID not supported");
               });*/
        } else // touch was not used
        {
          NVRDataModel.log("not checking for touchID");
        }

        if (loginData.usePin) {
          // this shows the pin prompt on screen
          $scope.pinPrompt = true;
          // dont call unlock, let the user type in code

        } else // no PIN Code so go directly to auth
        {

          unlock(true);
        }

      } else // login creds are not present
      {
        NVRDataModel.debug("PortalLogin: Not logged in, so going to login");
        if (NVRDataModel.isFirstUse()) {
          NVRDataModel.debug("First use, showing warm and fuzzy...");
          $ionicHistory.nextViewOptions({
            disableAnimate: true,
            disableBack: true
          });
          $state.go('app.first-use');
          return;
        } else {
          if (!$rootScope.userCancelledAuth) {
            $ionicHistory.nextViewOptions({
              disableAnimate: true,
              disableBack: true
            });

            $state.go("app.login", {
              "wizard": false
            });
            return;
          } else {
            // do this only once - rest for next time
            $rootScope.userCancelledAuth = false;
          }
        }
      }

    });

  //-------------------------------------------------------------------------------
  // remove status is pin is empty
  //-------------------------------------------------------------------------------

  $scope.pinChange = function () {
    if ($scope.pindata.pin == null) {
      $scope.pindata.status = "";
    }
  };

  //-------------------------------------------------------------------------------
  // unlock app if PIN is correct
  //-------------------------------------------------------------------------------
  $scope.unlock = function () {
    // call with false meaning check for pin
    unlock(false);
  };

  //------------------------------------------------------------------------
  // Aaron Lager hack - can't figure out why he gets a 401 after
  // successful login and then it works after resaving
  //------------------------------------------------------------------------
  function tryLoggingSecondTimeHack() {
    var d = $q.defer();

    zmAutoLogin.doLogin("<button class='button button-clear' style='line-height: normal; min-height: 0; min-width: 0;color:#fff;' ng-click='$root.cancelAuth()'><i class='ion-close-circled'></i>&nbsp;" + $translate.instant('kAuthenticating') + "...</button>")
      .then(function (data) // success
        {
          NVRDataModel.debug("2nd auth login worked");
          NVRDataModel.getAPIversion()
            .then(function (data) {
                NVRDataModel.getKeyConfigParams(1);
                NVRDataModel.log("2nd auth:Got API version: " + data);
                $rootScope.apiVersion = data;
                var ld = NVRDataModel.getLogin();
                if (NVRDataModel.versionCompare(data, zm.minAppVersion) == -1 && data != "0.0.0") {

                  $state.go('app.lowversion', {
                    "ver": data
                  });
                  return;
                }

                if (NVRDataModel.versionCompare(data, zm.recommendedAppVersion) == -1 && data != "0.0.0") {

                  NVRDataModel.hrsSinceChecked("zmVersion")
                    .then(function (val) {
                      NVRDataModel.debug("ZM Version nag: Checking " + val + " with " + zm.zmVersionCheckNag);
                      if (val >= zm.zmVersionCheckNag && 0) {
                        NVRDataModel.updateHrsSinceChecked("zmVersion");
                        $state.go('app.importantmessage', {
                          "ver": data
                        });
                        return;
                      }

                    });

                }

                /*if (data == "0.0.0")
                {

                    NVRDataModel.log("2nd Auth:API getVersion succeeded but returned 0.0.0 " + JSON.stringify(data));
                    NVRDataModel.displayBanner('error', ['ZoneMinder authentication failed']);
                    $state.go("login",
                    {
                        "wizard": false
                    });
                    return;
                }*/
                // coming here means continue
                //EventServer.init();

                var statetoGo = $rootScope.lastState ? $rootScope.lastState : 'app.montage';
                //NVRDataModel.debug ("logging state transition");
                NVRDataModel.debug("2nd Auth: Transitioning state to: " +
                  statetoGo + " with param " + JSON.stringify($rootScope.lastStateParam));

                alreadyTransitioned = true;
                $state.go(statetoGo, $rootScope.lastStateParam);
                return;

              },
              function (error) {
                NVRDataModel.debug("2nd auth API failed, going to login");
                d.reject("failed 2nd auth");
                return (d.promise);

              });

        },
        function (error) {
          NVRDataModel.debug("2nd auth hack failed, going to login");
          d.reject("failed 2nd auth");
          return (d.promise);
        });

    return (d.promise);
  }


  
  //broadcastHandles.push(pp);

  function unlock(idVerified) {
    /*
    idVerified == true means no pin check needed
               == false means check PIN
    */

    NVRDataModel.debug("unlock called with check PIN=" + idVerified);
    if (idVerified || ($scope.pindata.pin == loginData.pinCode)) {
      NVRDataModel.debug("PIN code entered is correct, or there is no PIN set");
      $rootScope.rand = Math.floor((Math.random() * 100000) + 1);
      zmAutoLogin.stop(); //safety
      zmAutoLogin.start();

      // PIN is fine, or not set so lets login
      zmAutoLogin.doLogin("<button class='button button-clear' style='line-height: normal; min-height: 0; min-width: 0;color:#fff;' ng-click='$root.cancelAuth()'><i class='ion-close-circled'></i>&nbsp;" + $translate.instant('kAuthenticating') + "...</button>")
        .then(function (data) // success
          {
            NVRDataModel.debug("PortalLogin: auth success");


            // $state.go("login" ,{"wizard": false});
            //login was ok, so get API details
            NVRDataModel.getAPIversion()
              .then(function (data) {
                  NVRDataModel.log("Got API version: " + data);
                  $rootScope.apiVersion = data;
                  var ld = NVRDataModel.getLogin();
                  if (NVRDataModel.versionCompare(data, zm.minAppVersion) == -1 && data != "0.0.0") {

                    $state.go('app.lowversion', {
                      "ver": data
                    });
                    return;
                  }

                  if (NVRDataModel.versionCompare(data, zm.recommendedAppVersion) == -1 && data != "0.0.0") {

                    NVRDataModel.hrsSinceChecked("zmVersion")
                      .then(function (val) {

                        NVRDataModel.debug("ZM Version nag: Checking " + val + " with " + zm.zmVersionCheckNag);
                        if (val >= zm.zmVersionCheckNag && 0) {
                          //https://api.github.com/repos/zoneminder/zoneminder/releases/latest
                          //tag_name
                          NVRDataModel.updateHrsSinceChecked("zmVersion");
                          $state.go('app.importantmessage', {
                            "ver": data
                          });
                          return;

                        }

                      });

                  }

                  /*if (data == "0.0.0")
                  {

                      NVRDataModel.log("API getVersion succeeded but returned 0.0.0 " + JSON.stringify(data));
                      NVRDataModel.displayBanner('error', ['ZoneMinder authentication failed']);
                      $state.go("login",
                      {
                          "wizard": false
                      });
                      return;

                  }*/
                  // coming here means continue
                  // console.log (">>>>>>>>>>>>>>>>>>>>>>>>>NEVER");

                  NVRDataModel.getKeyConfigParams(1);
                  NVRDataModel.getTimeZone();
                  EventServer.init();

                  NVRDataModel.zmPrivacyProcessed()
                    .then(function (val) {
                    //  console.log(">>>>>>>>>>>>>>>>>>> PRIVACY PROCESSED:" + val);
                      if (!val) {
                        var alertPopup = $ionicPopup.alert({
                          title: $translate.instant('kNote'),
                          template: $translate.instant('kDataPrivacyZM'),
                          okText: $translate.instant('kButtonOk'),
                          cancelText: $translate.instant('kButtonCancel'),
                        });

                      }
                    });

                  // if push broadcast happens BEFORE this, then no 
                  // state change will occur here which is good

                  // if push happens AFTER this, then while going to
                  // lastState, it will interrupt and go to onTap
                  // (I HOPE...)
                
                    //console.log ("NOTIFICATION TAPPED INSIDE CHECK IS "+$rootScope.tappedNotification);
                    var statetoGo = $rootScope.lastState ? $rootScope.lastState : 'app.montage';
                    //  NVRDataModel.debug("logging state transition");

                    if (!processPush) {
                      alreadyTransitioned = true;
                      NVRDataModel.debug("Transitioning state to: " +
                      statetoGo + " with param " + JSON.stringify($rootScope.lastStateParam));

                    $state.go(statetoGo, $rootScope.lastStateParam);
                    return;
                    }
                    else {
                      NVRDataModel.debug ("Deferred handling of push:");
                      processPush = false;
                      var s = NVRDataModel.evaluateTappedNotification();
                      NVRDataModel.debug("tapped Notification evaluation:"+ JSON.stringify(s));
                      $ionicHistory.nextViewOptions({
                        disableAnimate:true,
                        disableBack: true
                      });
                      $state.go(s[0],s[1],s[2]);
                      return;
                    }
                   

               
                },
                function (error) { // API Error
                  NVRDataModel.log("API Error handler: going to login getAPI returned error: " + JSON.stringify(error));
                  //NVRDataModel.displayBanner('error', ['ZoneMinder authentication failed']);

                  NVRDataModel.debug("Doing the Aaron Hack after 1 sec....");
                  $timeout(function () {
                    tryLoggingSecondTimeHack()
                      .then(function success(s) {
                          NVRDataModel.log("2nd time login hack worked!, nothing to do");
                          NVRDataModel.getTimeZone();
                        },
                        function error(e) {

                          if ($rootScope.apiValid == true) {
                            $state.go("app.login", {
                              "wizard": false
                            });
                            return;
                          } else {
                            $state.go("app.invalidapi");
                            return;
                          }

                        });

                    return;

                  }, 1000);

                });



          },
          // coming here means auth error
          // so go back to login
          function (error) {
            NVRDataModel.debug("PortalLogin: error authenticating " +
              JSON.stringify(error));
            if (!$rootScope.userCancelledAuth) {
              NVRDataModel.displayBanner('error', ['ZoneMinder authentication failed', 'Please check API settings']);
              $ionicHistory.nextViewOptions({
                disableAnimate: true,
                disableBack: true
              });
              $state.go("app.login", {
                "wizard": false
              });
              return;
            } else {
              // if user cancelled auth I guess we go to login
              $rootScope.userCancelledAuth = false;
              $state.go("app.login", {
                "wizard": false
              });
              return;
            }
          });
    } else {
      $scope.pindata.status = "Invalid PIN";

      // wobble the input box on error
      var element = angular.element(document.getElementById("pin-box"));

      element.addClass("animated shake")
        .one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend',
          function () {
            element.removeClass("animated shake");
          });
    }
  }

  //-------------------------------------------------------------------------------
  // Controller Main
  //-------------------------------------------------------------------------------
  // console.log("************* ENTERING PORTAL MAIN ");
  NVRDataModel.log("Entering Portal Main");
  var loginData;
  $ionicSideMenuDelegate.canDragContent(true);


}]);
