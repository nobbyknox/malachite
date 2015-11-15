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
        .when('/bookmarks/:id', {
            templateUrl: 'partials/bookmark.html',
            controller: 'BookmarkController'
        })
        .when('/bookmarks/group/:groupId', {
            templateUrl: 'partials/bookmarks.html',
            controller: 'BookmarksOfGroupController'
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

            if ($rootScope.sessionUser) {
                $http.get($rootScope.config.baseUrl + 'groups?token=' + $rootScope.sessionUser.token)
                    .success(function (data) {
                        $rootScope.groups = data;
                    });
            }
        });


    $rootScope.$on('$locationChangeStart', function (event, next, current) {

        $rootScope.previousPage = current;

        if (!$rootScope.sessionUser) {
            $location.path('/login');
        }
    });

});

malApp.controller('IndexController', function ($rootScope) { });

malApp.controller('TestController', function ($rootScope) { });

malApp.controller('LoginController', function ($rootScope, $window) {
    if ($rootScope.config.loginRedirectDelay > 0) {
        setTimeout(function () {
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

malApp.controller('BookmarkController', function ($scope, $rootScope, $routeParams, $http, $window) {

    if ($routeParams.id === 'new') {
        $scope.bookmark = {};
    } else {
        $http.get($rootScope.config.baseUrl + 'bookmarks/' + $routeParams.id + '?token=' + $rootScope.sessionUser.token)
            .success(function (data) {
                $scope.bookmark = data[0] || data;
            });
    }

    $scope.save = function() {

        if ($routeParams.id === 'new') {

            $scope.bookmark.userId = 2;
            $scope.bookmark.dateCreated = moment().format('YYYY-MM-DD HH:mm:ss');

            $http.post($rootScope.config.baseUrl + 'bookmarks?token=' + $rootScope.sessionUser.token, $scope.bookmark)
                .success(function() {
                    if ($rootScope.previousPage) {
                        $window.location = $rootScope.previousPage;
                    }
                }, function(err) {
                    console.log(err);
                });
        } else {
            $http.put($rootScope.config.baseUrl + 'bookmarks?token=' + $rootScope.sessionUser.token, $scope.bookmark)
                .success(function() {
                    if ($rootScope.previousPage) {
                        $window.location = $rootScope.previousPage;
                    }
                }, function(err) {
                    console.log(err);
                });
        }
    }

});

malApp.controller('BookmarksOfGroupController', function ($scope, $rootScope, $routeParams, $http) {

    $http.get($rootScope.config.baseUrl + 'bookmarks/group/' + $routeParams.groupId + '?token=' + $rootScope.sessionUser.token)
        .success(function (data) {
            //console.log('bookmarks: ' + JSON.stringify(data));
            $scope.bookmarks = data;

            $http.get($rootScope.config.baseUrl + 'groups/' + $routeParams.groupId + '?token=' + $rootScope.sessionUser.token)
                .success(function(data) {
                    //console.log(data);
                    $scope.group = data[0] || data;
                });
        });

});
