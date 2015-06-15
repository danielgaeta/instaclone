angular.module('GitApp')
	.controller('DetailCtrl', function($scope, $rootScope, $location, API) {

		var repoName = $location.path().split('/').pop();

		API.getStatsByRepo(repoName).success(function(data) {
			$scope.contributers = [];
			for(var i=0; i<data.profile.length; i++) {
				$scope.contributers.push({
					'displayName': data.profile[i].author.login,
					'total': data.profile[i].total
				});
			}

			console.log($scope.contributers);
		});

		$scope.like = function() {
			$scope.hasLiked = true;
			API.likeMedia(mediaId).error(function(data) {
				sweetAlert('Error', data.message, 'error');
			});
		};
	});