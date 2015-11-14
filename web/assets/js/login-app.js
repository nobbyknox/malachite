'use strict';

var loginApp = angular.module('loginApp', [
    'ngRoute',
    'ngCookies'
]);

loginApp.config(function($routeProvider) {

    // Define the routes
    $routeProvider
        .when('/', {
            controller: 'LoginController'
            })
        .otherwise({
            redirectTo: '/'
        });

});

loginApp.run(function($rootScope, $http, $cookies, $window) {

    $rootScope.pageTitle = 'Bookmarkly - please sign in';

    $http.get('/config')
        .success(function (data) {
            $rootScope.config = data;

            // If the visitor is already logged in (has a cookie), take him to the main site.
            var biscuit = $cookies.getObject('bookmarklyLogin');
            if (biscuit) {
                $window.location = $rootScope.config.baseUrl + $rootScope.config.mainAppPath;
            }
        });

});

loginApp.controller('LoginController', function($scope, $rootScope, $http, $cookies, $window) {

    $scope.login = function() {


        $http.post($rootScope.config.baseUrl + 'authenticate', {'username': $scope.username, 'password': $scope.password})
            .success(function (data) {

                if (data && data.token) {
                    var cookiePayload = {
                        username: $scope.username,
                        token: data.token
                    };
                    $cookies.putObject('bookmarklyLogin', cookiePayload, { 'expires': new Date(2100, 1, 1) });
                    $window.location = $rootScope.config.baseUrl + $rootScope.config.mainAppPath;
                } else {
                    console.log('Incorrect! Try again');
                }
            });


    };
});


// -----------------------------------------------------------------------------

//function guid() {
//    function s4() {
//        return Math.floor((1 + Math.random()) * 0x10000)
//            .toString(16)
//            .substring(1);
//    }
//    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
//        s4() + '-' + s4() + s4() + s4();
//}
