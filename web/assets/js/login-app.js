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


        $http.post($rootScope.config.baseUrl + '/authenticate', {'username': $scope.username, 'password': $scope.password})
            .then(function (serverResponse) {

                console.log(JSON.stringify(serverResponse));
                console.log('Token: ' + serverResponse.data.token);

                var cookiePayload = {
                    userId: serverResponse.id,
                    username: $scope.username,
                    token: serverResponse.data.token
                };

                //setTimeout(function() {
                //    $cookies.putObject('bookmarklyLogin', cookiePayload, { 'expires': new Date(2100, 1, 1) });
                //    $window.location = $rootScope.config.baseUrl + $rootScope.config.mainAppPath;
                //}, 10000);

                $cookies.putObject('bookmarklyLogin', cookiePayload, { 'expires': new Date(2100, 1, 1) });
                $window.location = $rootScope.config.baseUrl + $rootScope.config.mainAppPath;

            }, function(err) {
                $('#passwordAlert').show();
                //$('#passwordAlert').alert();
            });


    };
});
