'use strict';

var malApp = angular.module('malApp', [
    'ngRoute',
    'ngCookies'
]);

malApp.config(function($routeProvider, $httpProvider) {

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
        .otherwise({
            redirectTo: '/'
        });

});

malApp.run(function($rootScope, $http, $location, $window, $cookies) {

    $rootScope.pageTitle = 'Project Malachite';

    // $rootScope.sessionUser = $cookies.getObject('wildhammerLogin');
    //
    // if ($rootScope.sessionUser) {
    //     console.log('Welcome back, ' + $rootScope.sessionUser.username);
    // }
    //
    // $rootScope.$on('$locationChangeStart', function (event, next, current) {
    //
    //     if (!$rootScope.sessionUser) {
    //         $location.path('/login');
    //
    //         setTimeout(function() {
    //             $window.location = 'http://localhost:3001/login.html';
    //         }, 6000);
    //
    //     }
    // });

    $rootScope.sessionUser = {
        username: 'nobbyknox@gmail.com',
        userId: 2,
        token: 'abc123'
    };

    setTimeout(function() {
        $http.get('http://localhost:3003/groups?token=' + $rootScope.sessionUser.token)
            .success(function (data) {
                $rootScope.groups = data;

                console.log('groups: ' + JSON.stringify(data));
            });
    }, 1000);

    $rootScope.selectGroup = function(id) {
        console.log('Selected group: ' + id);
        $rootScope.selectedGroup = id;
    };

});

malApp.controller('IndexController', function($rootScope) {
    // Highlight the corresponding menu and tab
    $rootScope.selectedMenu = 'root';
    $rootScope.selectedTab = 'root';
});

// malApp.controller('TestController', function($rootScope) {
//     // Highlight the corresponding menu and tab
//     $rootScope.selectedMenu = 'instance';
//     $rootScope.selectedTab = 'users';
// });
//
// malApp.controller('LoginController', function($rootScope) {
//     // Highlight the corresponding menu and tab
//     $rootScope.selectedMenu = 'root';
//     $rootScope.selectedTab = 'root';
// });
//
// malApp.controller('LogoutController', function($rootScope, $cookies, $window) {
//     // Highlight the corresponding menu and tab
//     $rootScope.selectedMenu = 'root';
//     $rootScope.selectedTab = 'root';
//
//     $cookies.remove('wildhammerLogin');
//     $rootScope.sessionUser = null;
//
//     setTimeout(function() {
//         $window.location = 'http://localhost:3001/login.html';
//     }, 4000);
// });