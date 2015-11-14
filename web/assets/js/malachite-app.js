'use strict';

var malApp = angular.module('malApp', [
    'ngRoute',
    'ngCookies',
    'ui.bootstrap'
]);

malApp.config(function ($routeProvider, $httpProvider) {

    // Define the routes
    $routeProvider
        .when('/', {
            templateUrl: 'partials/index.html',
            controller: 'IndexController'
        })
        .when('/login', {
            templateUrl: 'partials/login-required.html',
            controller: 'LoginController'
        })
        .when('/logout', {
            templateUrl: 'partials/logout.html',
            controller: 'LogoutController'
        })
        .when('/test', {
            templateUrl: 'partials/test.html',
            controller: 'TestController'
        })
        .otherwise({
            redirectTo: '/'
        });

});

malApp.run(function ($rootScope, $http, $location, $window, $cookies) {

    $rootScope.pageTitle = 'Project Malachite';

    $rootScope.sessionUser = $cookies.getObject('bookmarklyLogin');

    if ($rootScope.sessionUser) {
        console.log('Welcome back, ' + $rootScope.sessionUser.username);
    }

    $http.get('/config')
        .success(function (data) {
            $rootScope.config = data;
            console.log('config: ' + JSON.stringify(data));

            if ($rootScope.sessionUser) {
                $http.get($rootScope.config.baseUrl + 'groups?token=' + $rootScope.sessionUser.token)
                    .success(function (data) {
                        $rootScope.groups = data;
                    });
            }
        });


    $rootScope.$on('$locationChangeStart', function (event, next, current) {
        if (!$rootScope.sessionUser) {
            $location.path('/login');
        }
    });

    $rootScope.selectGroup = function (id) {
        console.log('Selected group: ' + id);
    };

});

malApp.controller('IndexController', function ($rootScope) {
});

malApp.controller('TestController', function($rootScope) {
});

malApp.controller('LoginController', function ($rootScope, $window) {
    if ($rootScope.config.loginRedirectDelay > 0) {
        setTimeout(function() {
            $window.location = $rootScope.config.baseUrl + $rootScope.config.loginAppPath;
        }, $rootScope.config.loginRedirectDelay);
    }
});

malApp.controller('LogoutController', function ($rootScope, $cookies, $window) {

    $cookies.remove('bookmarklyLogin');
    $rootScope.sessionUser = null;

    if ($rootScope.config.logoutRedirectDelay > 0) {
        setTimeout(function () {
            $window.location = $rootScope.config.baseUrl + $rootScope.config.loginAppPath;
        }, $rootScope.config.logoutRedirectDelay);
    }

});
