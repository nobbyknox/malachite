'use strict';

var loginApp = angular.module('loginApp', [
    'ngRoute',
    'ngCookies'
]);

loginApp.run(function($rootScope) {
    $rootScope.pageTitle = 'Login to the VBX Management Interface';
});

loginApp.config(function($routeProvider) {

    // Define the routes
    $routeProvider
        .when('/', {
            templateUrl: 'partials/index.html',
            controller: 'LoginController'
            })
        .otherwise({
            redirectTo: '/'
        });

});

loginApp.controller('LoginController', function($scope, $cookies, $window) {

    var biscuit = $cookies.getObject('wildhammerLogin');

    if (biscuit) {
        $window.location = 'http://localhost:3001/';
        return;
    }

    $scope.login = function() {

        var cookiePayload = {
            username: $scope.username,
            token: "abc123-def456-ghi789-jkl012"
        };

        console.log('Login cookie: ' + JSON.stringify(cookiePayload));
        $cookies.putObject('wildhammerLogin', cookiePayload, { 'expires': new Date(2100, 1, 1) });

        console.log('path: ' + $window.location);

        $window.location = 'http://localhost:3001/';

    };
});
