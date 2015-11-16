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
        .when('/groups', {
            templateUrl: 'partials/groups.html',
            controller: 'GroupsController'
        })
        .when('/groups/:id', {
            templateUrl: 'partials/group.html',
            controller: 'GroupController'
        })
        .when('/tags', {
            templateUrl: 'partials/tags.html',
            controller: 'TagsController'
        })
        .when('/tags/:id', {
            templateUrl: 'partials/tag.html',
            controller: 'TagController'
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

            $scope.bookmark.userId = $rootScope.sessionUser.userId;
            $scope.bookmark.dateCreated = moment().format('YYYY-MM-DD HH:mm:ss');  // TODO: Get format from config

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

malApp.controller('GroupsController', function ($scope, $rootScope, $routeParams, $http) {

    $http.get($rootScope.config.baseUrl + 'groups?token=' + $rootScope.sessionUser.token)
        .success(function (data) {
            $scope.groups = data;
        });

});

malApp.controller('GroupController', function ($scope, $rootScope, $routeParams, $http, $window) {

    if ($routeParams.id === 'new') {
        $scope.group = {};
    } else {
        $http.get($rootScope.config.baseUrl + 'groups/' + $routeParams.id + '?token=' + $rootScope.sessionUser.token)
            .success(function (data) {
                $scope.group = data[0] || data;
            });
    }

    $scope.save = function() {

        if ($routeParams.id === 'new') {

            $scope.group.userId = $rootScope.sessionUser.userId;
            $scope.group.dateCreated = moment().format('YYYY-MM-DD HH:mm:ss');  // TODO: Get format from config

            $http.post($rootScope.config.baseUrl + 'groups?token=' + $rootScope.sessionUser.token, $scope.group)
                .success(function() {
                    if ($rootScope.previousPage) {
                        $window.location = $rootScope.previousPage;
                    }
                }, function(err) {
                    console.log(err);
                });
        } else {
            $http.put($rootScope.config.baseUrl + 'groups?token=' + $rootScope.sessionUser.token, $scope.group)
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

malApp.controller('TagsController', function ($scope, $rootScope, $routeParams, $http) {

    $http.get($rootScope.config.baseUrl + 'tags?token=' + $rootScope.sessionUser.token)
        .success(function (data) {
            $scope.tags = data;
        });

});

malApp.controller('TagController', function ($scope, $rootScope, $routeParams, $http, $window) {

    if ($routeParams.id === 'new') {
        $scope.tag = {};
    } else {
        $http.get($rootScope.config.baseUrl + 'tags/' + $routeParams.id + '?token=' + $rootScope.sessionUser.token)
            .success(function (data) {
                $scope.tag = data[0] || data;
            });
    }

    $scope.save = function() {

        if ($routeParams.id === 'new') {

            $scope.tag.userId = $rootScope.sessionUser.userId;
            $scope.tag.dateCreated = moment().format('YYYY-MM-DD HH:mm:ss');  // TODO: Get format from config

            $http.post($rootScope.config.baseUrl + 'tags?token=' + $rootScope.sessionUser.token, $scope.tag)
                .success(function() {
                    if ($rootScope.previousPage) {
                        $window.location = $rootScope.previousPage;
                    }
                }, function(err) {
                    console.log(err);
                });
        } else {
            $http.put($rootScope.config.baseUrl + 'tags?token=' + $rootScope.sessionUser.token, $scope.tag)
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
