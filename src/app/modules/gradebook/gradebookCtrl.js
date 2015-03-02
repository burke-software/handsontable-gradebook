angular.module('gradeBookApp.controllers')
.controller(
  'gradeBookCtrl',
  [
    '$scope',
    'courseFactory',
    'classSectionFactory',
    '$log',
    function ($scope, courseFactory, classSectionFactory, $log) {

      var getCourses = function () {
        courseFactory.get().$promise.then(
          function (result) {
            $scope.courses = result['results'];
          }
        )
      };

      $scope.getSection = function (sectionId) {
        $scope.activeSection = sectionId;
        classSectionFactory.getBySection({sectionId: sectionId}).$promise.then(
          function (result) {
            console.log(result);
            $scope.users = [];
            //prepareAssignments(result);
          },
          function (error) {
            $log.error('singleSectionCtrl:getSection', error);
          }
        )
      };

      $scope.search = {
        where: 'all',
        what: null
      };

      $scope.activeSection = null;


      $scope.setSearchRange = function (value) {
        $scope.search.where = value;

      };



      getCourses();

    }
  ]
);
