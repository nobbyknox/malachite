'use strict';

var malApp = angular.module('malApp', [
    'ngRoute',
    'ngCookies'
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
        });


    $rootScope.$on('$locationChangeStart', function (event, next, current) {

        if (!$rootScope.sessionUser) {
            $location.path('/login');

            setTimeout(function() {
                $window.location = $rootScope.config.baseUrl + $rootScope.config.loginAppPath;
            }, 6000);

        }
    });

    setTimeout(function() {
        $http.get($rootScope.config.baseUrl + 'groups?token=' + $rootScope.sessionUser.token)
            .success(function (data) {
                $rootScope.groups = data;

                console.log('groups: ' + JSON.stringify(data));
            });
    }, 1000);

    $rootScope.selectGroup = function (id) {
        console.log('Selected group: ' + id);
        $rootScope.selectedGroup = id;
    };

});

malApp.controller('IndexController', function ($rootScope) {
    // Highlight the corresponding menu and tab
    $rootScope.selectedMenu = 'root';
    $rootScope.selectedTab = 'root';
});

malApp.controller('TestController', function($rootScope) {
    console.log('In TestController');
});

malApp.controller('LoginController', function ($rootScope) {
    // Highlight the corresponding menu and tab
    $rootScope.selectedMenu = 'root';
    $rootScope.selectedTab = 'root';
});

malApp.controller('LogoutController', function ($rootScope, $cookies, $window) {
    // Highlight the corresponding menu and tab
    $rootScope.selectedMenu = 'root';
    $rootScope.selectedTab = 'root';

    $cookies.remove('bookmarklyLogin');
    $rootScope.sessionUser = null;

    setTimeout(function () {
        $window.location = $rootScope.config.baseUrl + $rootScope.config.loginAppPath;
    }, 4000);
});
