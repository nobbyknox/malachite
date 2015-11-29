'use strict';

var malApp = angular.module('malApp', [
    'ngRoute',
    'ngCookies',
    'ui.bootstrap',
    'ngTagsInput'
]);

malApp.config(function($routeProvider) {

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
        .when('/bookmarks', {
            templateUrl: 'partials/bookmarks.html',
            controller: 'BookmarksController'
        })
        //.when('/bookmarks/starred', {
        //    templateUrl: 'partials/bookmarks.html',
        //    controller: 'StarredBookmarksController'
        //})
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

malApp.run(function($rootScope, $http, $location, $window, $cookies) {

    $rootScope.pageTitle = 'Bookmarkly';
    $rootScope.searchQuery = '';

    $rootScope.sessionUser = $cookies.getObject('bookmarklyLogin');

    if ($rootScope.sessionUser) {

        $http.post('/validatetoken', { token: $rootScope.sessionUser.token })
            .then(function() {
                console.log('Token %s is valid', $rootScope.sessionUser.token);
                console.log('Welcome back, %s', $rootScope.sessionUser.username);
                bootstrapApp($rootScope, $http);
            }, function(response) {
                $rootScope.sessionUser = null;
                $cookies.remove('bookmarklyLogin');
                console.log(JSON.stringify(response));
            });

    } else {
        $location.path('/login');
    }

    $rootScope.$on('$locationChangeStart', function(event, next, current) {

        $rootScope.previousPage = current;

        if (!$rootScope.sessionUser) {
            $location.path('/login');
        }
    });

    $rootScope.search = function() {
        if ($rootScope.searchQuery.length >= 3) {
            $window.location = '#/bookmarks?query=' + $rootScope.searchQuery;
        }
    };

});

malApp.controller('IndexController', function($rootScope, $window) {
});

malApp.controller('TestController', function($rootScope) {
});

malApp.controller('LoginController', function($rootScope, $window) {

    var delay = ($rootScope.config ? $rootScope.config.loginRedirectDelay : 5000);
    var location = ($rootScope.config ? $rootScope.config.baseUrl + $rootScope.config.loginAppPath : '/login.html');

    setTimeout(function() {
        $window.location = location;
    }, delay);

});

malApp.controller('LogoutController', function($rootScope, $cookies, $window) {

    $cookies.remove('bookmarklyLogin');
    $rootScope.sessionUser = null;

    if ($rootScope.config.logoutRedirectDelay > 0) {
        setTimeout(function() {
            $window.location = $rootScope.config.baseUrl + $rootScope.config.loginAppPath;
        }, $rootScope.config.logoutRedirectDelay);
    }

});

malApp.controller('BookmarksController', function($scope, $rootScope, $routeParams, $http, $window) {

    var path = '/bookmarks?token=' + $rootScope.sessionUser.token;

    if ($routeParams.starred) {
        path += '&starred=' + $routeParams.starred;
        $scope.starred = true;
    }

    if ($routeParams.query) {
        path += '&query=' + $routeParams.query;
    }

    $http.get($rootScope.config.baseUrl + path)
        .success(function(data) {
            $scope.bookmarks = data;
        });

    $scope.editBookmark = function(id) {
        $window.location = '#/bookmarks/' + id;
    };

});

malApp.controller('BookmarkController', function($scope, $rootScope, $routeParams, $http, $window, $q) {

    $('#title').focus();

    $scope.groups = [];
    $scope.tags = [];

    $scope.loadGroups = function(query) {

        var deferred = $q.defer();

        $http.get($rootScope.config.baseUrl + '/groups?token=' + $rootScope.sessionUser.token + '&search=' + query)
            .success(function(data) {
                var retArray = [{text: query}];

                if (data && data.length > 0) {
                    data.forEach(function(item) {
                        if (item.name !== query) {
                            retArray.push({text: item.name});
                        }
                    });

                }

                deferred.resolve(retArray);
            });

        return deferred.promise;
    };

    $scope.loadTags = function(query) {

        var deferred = $q.defer();

        $http.get($rootScope.config.baseUrl + '/tags?token=' + $rootScope.sessionUser.token + '&search=' + query)
            .success(function(data) {
                var retArray = [{text: query}];

                if (data && data.length > 0) {
                    data.forEach(function(item) {
                        if (item.name !== query) {
                            retArray.push({text: item.name});
                        }
                    });

                }

                deferred.resolve(retArray);
            });

        return deferred.promise;
    };

    if ($routeParams.id === 'new') {
        $scope.bookmark = {
            rating: 1
        };
    } else {
        $http.get($rootScope.config.baseUrl + '/bookmarks/' + $routeParams.id + '?token=' + $rootScope.sessionUser.token)
            .success(function(data) {
                $scope.bookmark = data[0] || data;

                if ($scope.bookmark && $scope.bookmark.groups) {

                    var tmpGroupArray = [];

                    $scope.bookmark.groups.forEach(function(groupItem) {
                        tmpGroupArray.push(groupItem.name);
                    });

                    if (tmpGroupArray && tmpGroupArray.length > 0) {
                        $scope.groups = tmpGroupArray;
                    }
                }

                if ($scope.bookmark && $scope.bookmark.tags) {

                    var tmpTagArray = [];

                    $scope.bookmark.tags.forEach(function(tagItem) {
                        tmpTagArray.push(tagItem.name);
                    });

                    if (tmpTagArray && tmpTagArray.length > 0) {
                        $scope.tags = tmpTagArray;
                    }
                }
            });
    }

    $scope.toggleStar = function() {
        if ($scope.bookmark.starred === 1) {
            $scope.bookmark.starred = 0;
        } else {
            $scope.bookmark.starred = 1;
        }
    };

    $scope.save = function() {

        var bookmarkWrapper = {
            model: $scope.bookmark,
            groupNames: [],
            tagNames: []
        };

        delete bookmarkWrapper.model.groups;
        delete bookmarkWrapper.model.tags;

        if ($scope.groups && $scope.groups.length > 0) {
            $scope.groups.forEach(function(item) {
                bookmarkWrapper.groupNames.push(item.text);
            });
        }

        if ($scope.tags && $scope.tags.length > 0) {
            $scope.tags.forEach(function(item) {
                bookmarkWrapper.tagNames.push(item.text);
            });
        }

        if ($routeParams.id === 'new') {

            bookmarkWrapper.model.userId = $rootScope.sessionUser.userId;
            bookmarkWrapper.dateCreated = moment().format('YYYY-MM-DD HH:mm:ss');  // TODO: Get format from config

            $http.post($rootScope.config.baseUrl + '/bookmarks?token=' + $rootScope.sessionUser.token, bookmarkWrapper)
                .success(function() {
                    if ($rootScope.previousPage) {
                        $window.location = $rootScope.previousPage;
                    }
                }, function(err) {
                    console.log(err);
                });
        } else {

            $http.put($rootScope.config.baseUrl + '/bookmarks?token=' + $rootScope.sessionUser.token, bookmarkWrapper)
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

//malApp.controller('StarredBookmarksController', function($scope, $rootScope, $routeParams, $http, $window) {
//
//    console.log('Top of StarredBookmarksController');
//
//    $http.get($rootScope.config.baseUrl + '/bookmarks?starred=1&token=' + $rootScope.sessionUser.token)
//        .then(function(data) {
//            $scope.bookmarks = data.data;
//        }, function(response) {
//            console.log(JSON.stringify(response));
//        });
//
//    $scope.editBookmark = function(id) {
//        $window.location = '#/bookmarks/' + id;
//    };
//
//});

malApp.controller('BookmarksOfGroupController', function($scope, $rootScope, $routeParams, $http, $window) {

    $http.get($rootScope.config.baseUrl + '/bookmarks/group/' + $routeParams.groupId + '?token=' + $rootScope.sessionUser.token)
        .then(function(data) {
            $scope.bookmarks = data.data;

            $http.get($rootScope.config.baseUrl + '/groups/' + $routeParams.groupId + '?token=' + $rootScope.sessionUser.token)
                .then(function(response) {
                    $scope.group = response.data[0] || response.data;
                }, function(response) {
                    console.log(JSON.stringify(response));
                });
        }, function(response) {
            console.log(JSON.stringify(response));
        });

    $scope.editBookmark = function(id) {
        $window.location = '#/bookmarks/' + id;
    };

});

malApp.controller('GroupsController', function($scope, $rootScope, $http, $window) {

    $http.get($rootScope.config.baseUrl + '/groups?token=' + $rootScope.sessionUser.token)
        .success(function(data) {
            $scope.groups = data;
        });

    $scope.editGroup = function(id) {
        $window.location = '#/groups/' + id;
    };

});

malApp.controller('GroupController', function($scope, $rootScope, $routeParams, $http, $window) {

    $('#name').focus();

    if ($routeParams.id === 'new') {
        $scope.group = {};
    } else {
        $http.get($rootScope.config.baseUrl + '/groups/' + $routeParams.id + '?token=' + $rootScope.sessionUser.token)
            .success(function(data) {
                $scope.group = data[0] || data;
            });
    }

    $scope.save = function() {

        if ($routeParams.id === 'new') {

            $scope.group.userId = $rootScope.sessionUser.userId;
            $scope.group.dateCreated = moment().format('YYYY-MM-DD HH:mm:ss');  // TODO: Get format from config

            $http.post($rootScope.config.baseUrl + '/groups?token=' + $rootScope.sessionUser.token, $scope.group)
                .success(function() {
                    if ($rootScope.previousPage) {
                        $window.location = '#/groups';
                    }
                }, function(err) {
                    console.log(err);
                });
        } else {
            $http.put($rootScope.config.baseUrl + '/groups?token=' + $rootScope.sessionUser.token, $scope.group)
                .success(function() {
                    if ($rootScope.previousPage) {
                        $window.location = '#/groups';
                    }
                }, function(err) {
                    console.log(err);
                });
        }
    }

});

malApp.controller('TagsController', function($scope, $rootScope, $http, $window) {

    $http.get($rootScope.config.baseUrl + '/tags?token=' + $rootScope.sessionUser.token)
        .success(function(data) {
            $scope.tags = data;
        });

    $scope.editTag = function(id) {
        $window.location = '#/tags/' + id;
    };

});

malApp.controller('TagController', function($scope, $rootScope, $routeParams, $http, $window) {

    $('#name').focus();

    if ($routeParams.id === 'new') {
        $scope.tag = {};
    } else {
        $http.get($rootScope.config.baseUrl + '/tags/' + $routeParams.id + '?token=' + $rootScope.sessionUser.token)
            .success(function(data) {
                $scope.tag = data[0] || data;
            });
    }

    $scope.save = function() {

        if ($routeParams.id === 'new') {

            $scope.tag.userId = $rootScope.sessionUser.userId;
            $scope.tag.dateCreated = moment().format('YYYY-MM-DD HH:mm:ss');  // TODO: Get format from config

            $http.post($rootScope.config.baseUrl + '/tags?token=' + $rootScope.sessionUser.token, $scope.tag)
                .success(function() {
                    if ($rootScope.previousPage) {
                        $window.location = '#/tags';
                    }
                }, function(err) {
                    console.log(err);
                });
        } else {
            $http.put($rootScope.config.baseUrl + '/tags?token=' + $rootScope.sessionUser.token, $scope.tag)
                .success(function() {
                    if ($rootScope.previousPage) {
                        $window.location = '#/tags';
                    }
                }, function(err) {
                    console.log(err);
                });
        }
    }

});


// -----------------------------------------------------------------------------
// Private functions
// -----------------------------------------------------------------------------

function bootstrapApp($rootScope, $http) {

    $http.get('/config')
        .success(function(data) {

            $rootScope.config = data;

            if ($rootScope.sessionUser) {
                $http.get($rootScope.config.baseUrl + '/groups?token=' + $rootScope.sessionUser.token)
                    .success(function(data) {
                        $rootScope.groups = data;
                    });
            }
        });

}
