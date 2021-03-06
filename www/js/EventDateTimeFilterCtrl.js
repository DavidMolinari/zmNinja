/* jshint -W041 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console,moment */

angular.module('zmApp.controllers')
  .controller('zmApp.EventDateTimeFilterCtrl', ['$scope', '$ionicSlideBoxDelegate', '$ionicSideMenuDelegate', '$rootScope', '$ionicHistory', 'NVR', '$state', function ($scope, $ionicScrollDelegate, $ionicSideMenuDelegate, $rootScope, $ionicHistory, NVR, $state) {

      //----------------------------------------------------------------
      // Alarm notification handling
      //----------------------------------------------------------------
      $scope.handleAlarms = function () {
        $rootScope.isAlarm = !$rootScope.isAlarm;
        if (!$rootScope.isAlarm) {
          $rootScope.alarmCount = "0";
          $ionicHistory.nextViewOptions({
            disableBack: true
          });
          $state.go("app.events", {
            "id": 0,
            "playEvent": false
          }, {
            reload: true
          });
          return;
        }
      };

      $scope.$on('$ionicView.beforeEnter', function () {
        $scope.today = moment().format("YYYY-MM-DD");
      });

      //--------------------------------------------------------------------------
      // Clears filters 
      //--------------------------------------------------------------------------

      $scope.removeFilters = function () {
        $rootScope.isEventFilterOn = false;
        $rootScope.fromDate = "";
        $rootScope.fromTime = "";
        $rootScope.toDate = "";
        $rootScope.toTime = "";
        $rootScope.fromString = "";
        $rootScope.toString = "";

        // if you come here via the events pullup
        // you are looking at a specific monitor ID
        // going back will only retain that monitor ID
        // so lets reload with all monitors
        // 
        //console.log (">>> BACKVIEW="+$ionicHistory.backTitle());

        if ($ionicHistory.backTitle() == 'Timeline') {
          $ionicHistory.goBack();
        } else // in events, backview is undefined?
        {
          $ionicHistory.nextViewOptions({
            disableBack: true
          });
          $state.go("app.events", {
            "id": 0,
            "playEvent": false
          });
          return;
        }

        //$ionicHistory.goBack();
      };

      //--------------------------------------------------------------------------
      // Saves filters in root variables so EventFilter can access it. I know:
      // don't root.
      //--------------------------------------------------------------------------
      $scope.saveFilters = function () {
        if (!$rootScope.fromDate) {
          //console.log("RESET fromDate");
          $rootScope.fromDate = new Date();
          NVR.debug("DateTimeFilter: resetting from date");
        }

        if (!$rootScope.toDate) {
          // console.log("RESET toDate");
          $rootScope.toDate = new Date();
          NVR.debug("DateTimeFilter: resetting to date");
        }

        if (!$rootScope.fromTime) {
          // console.log("RESET fromTime");
          $rootScope.fromTime = new Date(99, 5, 24, 0, 0, 0, 0); //moment().format("hh:mm:ss");
          NVR.debug("DateTimeFilter: resetting from time");
        }

        if (!$rootScope.toTime) {
          //console.log("RESET toTime");
          $rootScope.toTime = new Date(99, 5, 24, 23, 59, 59, 0);
          //$rootScope.toTime = "01:01:02"; //moment().format("hh:mm:ss");
          NVR.debug("DateTimeFilter: resetting to time");
        }

        if ($rootScope.fromDate > $rootScope.toDate) {
          NVR.log("From date > To Date, swapping");
          var t = $rootScope.fromDate;
          $rootScope.fromDate = $rootScope.toDate;
          $rootScope.toDate = t;
        }

        $rootScope.isEventFilterOn = true;
        $rootScope.fromString = moment($rootScope.fromDate).format("YYYY-MM-DD") + " " + moment($rootScope.fromTime).format("HH:mm:ss");

        $rootScope.toString = moment($rootScope.toDate).format("YYYY-MM-DD") + " " + moment($rootScope.toTime).format("HH:mm:ss");

        //console.log("CONCAT DATES " + temp);
        //
        // var startDate = moment(temp).format("YYYY-MM-DD hh:mm:ss");
        NVR.debug("DateTimeFilter: From/To is now: " + $rootScope.fromString + " & " + $rootScope.toString);
        $ionicHistory.goBack();
      };

    }

  ]);
