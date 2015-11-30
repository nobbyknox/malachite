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

    // If the visitor is already logged in (has a cookie), take him to the main site.
    var biscuit = $cookies.getObject('bookmarklyLogin');
    if (biscuit) {
        $window.location = '/';
    }

});

loginApp.controller('LoginController', function($scope, $rootScope, $http, $cookies, $window) {

    $scope.login = function() {

        $http.post('/authenticate', {'username': $scope.username, 'password': $scope.password})
            .then(function (serverResponse) {

                //console.log('Response from auth service: ' + JSON.stringify(serverResponse));
                //console.log('Token: ' + serverResponse.data.token);

                var cookiePayload = {
                    userId: serverResponse.data.userId,
                    username: serverResponse.data.username,
                    screenName: serverResponse.data.screenName,
                    token: serverResponse.data.token
                };

                //console.log('Written cookie: ', cookiePayload);

                $cookies.putObject('bookmarklyLogin', cookiePayload, { 'expires': new Date(2100, 1, 1) });
                $window.location = '/';

            }, function(err) {
                $('#passwordAlert').show();
            });

    };
});
