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
        .when('/globallogout', {
            templateUrl: 'partials/global-logout.html',
            controller: 'GlobalLogoutController'
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
        .when('/bookmarks/group/:groupName', {
            templateUrl: 'partials/bookmarks.html',
            controller: 'BookmarksOfGroupController'
        })
        .when('/bookmarks/tag/:tagName', {
            templateUrl: 'partials/bookmarks.html',
            controller: 'BookmarksOfTagController'
        })
        .when('/bookmarks/x/recent', {
            templateUrl: 'partials/bookmarks.html',
            controller: 'RecentBookmarksController'
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
        .when('/about', {
            templateUrl: 'partials/about.html',
            controller: 'AboutController'
        })
        .otherwise({
            redirectTo: '/'
        });

});

malApp.run(function($rootScope, $http, $location, $window, $cookies) {

    $rootScope.pageTitle = 'Bookmarkly';
    $rootScope.searchQuery = '';
    $rootScope.feedbackSubjects = ['I have a question', 'I have a suggestion', 'I found a problem'];
    $rootScope.feedbackSubject = $rootScope.feedbackSubjects[0];
    $rootScope.feedbackBody = '';

    $rootScope.sessionUser = $cookies.getObject('bookmarklyLogin');

    if ($rootScope.sessionUser) {
        $http.post('/validatetoken', {token: $rootScope.sessionUser.token})
            .then(function() {
                console.log('Welcome back, %s', $rootScope.sessionUser.screenName);
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

        if (!next.includes('/bookmarks')) {
            $rootScope.searchQuery = '';
        }

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

    $rootScope.sendFeedback = function() {
        console.log('Subject: ' + $rootScope.feedbackSubject);
        console.log('Body: ' + $rootScope.feedbackBody);

        let feedbackModel = {
            username: $rootScope.sessionUser.username,
            screenName: $rootScope.sessionUser.screenName,
            location: $window.location.href,
            subject: $rootScope.feedbackSubject,
            message: $rootScope.feedbackBody
        };

        $http.post('/feedback?token=' + $rootScope.sessionUser.token, feedbackModel)
            .success(function() {
                console.log('Feedback submitted successfully');
            })
            .error(function(data) {
                console.log('Unable to submit feedback: ' + JSON.stringify(data));
                alert('An error occurred during the posting of your feedback');
            });

        $rootScope.feedbackSubject = $rootScope.feedbackSubjects[0];
        $rootScope.feedbackBody = '';

        $('#feedbackModal').modal('hide');
    };

    $rootScope.showMessage = function(title, message) {
        $('#message-modal-label').html(title);
        $('#message-body').html(message);
        $('#message-modal').modal('show');
    };

    $rootScope.deleteCallback = function() {
        console.log('Hello (deleted) World!');
    };

});

malApp.controller('IndexController', function($rootScope, $window) {
});

malApp.controller('TestController', function($rootScope) {
});

malApp.controller('LoginController', function($rootScope, $window) {

    setTimeout(function() {
        $window.location = '/login.html';
    }, 5000);

});

malApp.controller('LogoutController', function($rootScope, $cookies, $window) {

    $cookies.remove('bookmarklyLogin');
    $rootScope.sessionUser = null;

    setTimeout(function() {
        $window.location = '/login.html';
    }, 4000);

});

malApp.controller('GlobalLogoutController', function($rootScope, $cookies, $window, $http) {

    var payload = {
        'userId': $rootScope.sessionUser.userId
    };

    $http.post('/globallogout?token=' + $rootScope.sessionUser.token, payload)
        .then(function() {
            $cookies.remove('bookmarklyLogin');
            $rootScope.sessionUser = null;
            console.log('You have been logged out on all devices');

            setTimeout(function() {
                $window.location = '/login.html';
            }, 4000);
        }, function(response) {
            console.log(JSON.stringify(response));
        });

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

    $http.get(path)
        .success(function(data) {
            $scope.bookmarks = data;
        });

    $scope.editBookmark = function(id) {
        $window.location = '#/bookmarks/' + id;
    };

    $scope.toggleStar = function(id) {
        _toggleStar(id, $scope.bookmarks, $http, $rootScope);
    };

});

malApp.controller('BookmarkController', function($scope, $rootScope, $routeParams, $http, $window, $q) {

    $('#title').focus();

    $scope.groups = [];
    $scope.tags = [];

    $scope.loadGroups = function(query) {

        var deferred = $q.defer();

        $http.get('/groups?token=' + $rootScope.sessionUser.token + '&search=' + query)
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

        $http.get('/tags?token=' + $rootScope.sessionUser.token + '&search=' + query)
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
        $http.get('/bookmarks/' + $routeParams.id + '?token=' + $rootScope.sessionUser.token)
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

    $scope.refreshThumbnail = function() {
        $http.post('/bookmarks/refreshthumbnail?token=' + $rootScope.sessionUser.token, { 'id': $scope.bookmark.id })
            .then(function(response) {
                $rootScope.showMessage('Thumbnail Refresh', 'The thumbnail for this bookmark will be refreshed shortly.');
            }, function(response) {
                $rootScope.showMessage('Oops!', JSON.stringify(response.data));
            });
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

            $http.post('/bookmarks?token=' + $rootScope.sessionUser.token, bookmarkWrapper)
                .success(function() {
                    if ($rootScope.previousPage) {
                        $window.location = $rootScope.previousPage;
                    }
                }, function(err) {
                    console.log(err);
                });
        } else {

            $http.put('/bookmarks?token=' + $rootScope.sessionUser.token, bookmarkWrapper)
                .success(function() {
                    if ($rootScope.previousPage) {
                        $window.location = $rootScope.previousPage;
                    }
                }, function(err) {
                    console.log(err);
                });
        }
    };

    $rootScope.deleteCallback = function() {
        $http.delete('/bookmarks/' + $scope.bookmark.id + '?token=' + $rootScope.sessionUser.token)
            .then(function() {
                $window.location = $rootScope.previousPage;
            }, function(data) {
                $rootScope.showMessage('', data);
            });
    };

});

malApp.controller('BookmarksOfGroupController', function($scope, $rootScope, $routeParams, $http, $window) {

    $scope.bookmarks = [];
    $scope.context = $routeParams.groupName;

    $http.get('/bookmarks/group/' + $routeParams.groupName + '?token=' + $rootScope.sessionUser.token)
        .then(function(data) {
            $scope.bookmarks = data.data;
        }, function(response) {
            console.log(JSON.stringify(response));
        });

    $scope.editBookmark = function(id) {
        $window.location = '#/bookmarks/' + id;
    };

    $scope.toggleStar = function(id) {
        _toggleStar(id, $scope.bookmarks, $http, $rootScope);
    };

});

malApp.controller('BookmarksOfTagController', function($scope, $rootScope, $routeParams, $http, $window) {

    $scope.bookmarks = [];
    $scope.context = $routeParams.tagName;

    $http.get('/bookmarks/tag/' + $routeParams.tagName + '?token=' + $rootScope.sessionUser.token)
        .then(function(data) {
            $scope.bookmarks = data.data;
        });

    $scope.editBookmark = function(id) {
        $window.location = '#/bookmarks/' + id;
    };

    $scope.toggleStar = function(id) {
        _toggleStar(id, $scope.bookmarks, $http, $rootScope);
    };
});

malApp.controller('RecentBookmarksController', function($scope, $rootScope, $http, $window) {

    $scope.bookmarks = [];

    $http.get('/bookmarks/x/recent?token=' + $rootScope.sessionUser.token)
        .then(function(data) {
            $scope.bookmarks = data.data;
        });

    $scope.editBookmark = function(id) {
        $window.location = '#/bookmarks/' + id;
    };

    $scope.toggleStar = function(id) {
        _toggleStar(id, $scope.bookmarks, $http, $rootScope);
    };
});

malApp.controller('GroupsController', function($scope, $rootScope, $http, $window) {

    $http.get('/groups?token=' + $rootScope.sessionUser.token)
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
        $http.get('/groups/' + $routeParams.id + '?token=' + $rootScope.sessionUser.token)
            .success(function(data) {
                $scope.group = data[0] || data;
            });
    }

    $scope.save = function() {

        if ($routeParams.id === 'new') {

            $scope.group.userId = $rootScope.sessionUser.userId;
            $scope.group.dateCreated = moment().format('YYYY-MM-DD HH:mm:ss');  // TODO: Get format from config

            $http.post('/groups?token=' + $rootScope.sessionUser.token, $scope.group)
                .success(function() {
                    if ($rootScope.previousPage) {
                        $window.location = '#/groups';
                    }
                }, function(err) {
                    console.log(err);
                });
        } else {
            $http.put('/groups?token=' + $rootScope.sessionUser.token, $scope.group)
                .success(function() {
                    if ($rootScope.previousPage) {
                        $window.location = '#/groups';
                    }
                }, function(err) {
                    console.log(err);
                });
        }
    };

    $rootScope.deleteCallback = function() {
        $http.delete('/groups/' + $scope.group.id + '?token=' + $rootScope.sessionUser.token)
            .then(function(data) {

                $http.get('/groups?token=' + $rootScope.sessionUser.token)
                    .success(function(data) {
                        $rootScope.groups = data;
                    });

                $window.location = '#/groups';
            });
    };

});

malApp.controller('TagsController', function($scope, $rootScope, $http, $window) {

    $http.get('/tags?token=' + $rootScope.sessionUser.token)
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
        $http.get('/tags/' + $routeParams.id + '?token=' + $rootScope.sessionUser.token)
            .success(function(data) {
                $scope.tag = data[0] || data;
            });
    }

    $scope.save = function() {

        if ($routeParams.id === 'new') {

            $scope.tag.userId = $rootScope.sessionUser.userId;
            $scope.tag.dateCreated = moment().format('YYYY-MM-DD HH:mm:ss');  // TODO: Get format from config

            $http.post('/tags?token=' + $rootScope.sessionUser.token, $scope.tag)
                .success(function() {
                    if ($rootScope.previousPage) {
                        $window.location = '#/tags';
                    }
                }, function(err) {
                    console.log(err);
                });
        } else {
            $http.put('/tags?token=' + $rootScope.sessionUser.token, $scope.tag)
                .success(function() {
                    if ($rootScope.previousPage) {
                        $window.location = '#/tags';
                    }
                }, function(err) {
                    console.log(err);
                });
        }
    };

    $rootScope.deleteCallback = function() {
        $http.delete('/tags/' + $scope.tag.id + '?token=' + $rootScope.sessionUser.token)
            .then(function() {
                $window.location = '#/tags';
            });
    };

});

malApp.controller('AboutController', function($scope, $rootScope, $http, $window) {});


// -----------------------------------------------------------------------------
// Directives
// -----------------------------------------------------------------------------

angular.module('malApp').directive('bookmarkTile', function() {
    return {
        templateUrl: 'partials/templates/bookmark-tile.html'
    };
});


// -----------------------------------------------------------------------------
// Private functions
// -----------------------------------------------------------------------------

function bootstrapApp($rootScope, $http) {

    if ($rootScope.sessionUser) {
        $http.get('/groups?token=' + $rootScope.sessionUser.token)
            .success(function(data) {
                $rootScope.groups = data;
            });
    }

}

function _toggleStar(id, bookmarks, $http, $rootScope) {

    console.log('Toggling star...');

    $http.post('/bookmarks/togglestar/' + id + '?token=' + $rootScope.sessionUser.token)
        .then(function(data) {
            console.log(data);

            bookmarks.forEach(function(item) {
                if (item.id === id) {
                    if (item.starred === 1) {
                        item.starred = 0;
                    } else {
                        item.starred = 1;
                    }
                    console.log('Setting bookmark ID ' + item.id + ' star value to ' + item.starred);
                }
            });
        }, function(data) {
            console.log(data);
        });
}
