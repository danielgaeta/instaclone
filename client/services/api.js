angular.module('GitApp')
  .factory('API', function($http, $window, $rootScope) {
 
    return {
      getRepos: function() {
        var displayName = $rootScope.currentUser.displayName;
        var url = 'http://localhost:3000/api/repos/' + displayName;
        return $http.get(url);
      },
      getStatsByRepo: function(repoName) {
        return $http.get('http://localhost:3000/api/repos/stats/' + repoName);
      },
      likeMedia: function(id) {
        return $http.post('http://localhost:3000/api/like', { mediaId: id });
      }
    }
 
  });


