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

      $scope.filtersAndSettingsVisible = false;
      $scope.assignmentVisible = false;

      $scope.search = {
        where: 'all',
        what: null
      };

      $scope.activeSection = null;

      $scope.setSearchRange = function (value) {
        $scope.search.where = value;
      };

      $scope.toggleFilterAndSettings = function () {
        $scope.assignmentVisible = false;
        $scope.filtersAndSettingsVisible = !$scope.filtersAndSettingsVisible;
      };

      $scope.toggleAssignments = function (readOnly) {
        $scope.readOnly = readOnly;
        $scope.filtersAndSettingsVisible = false;
        $scope.assignmentVisible = !$scope.assignmentVisible;
      };

      $scope.editAssignment = function () {
        $scope.readOnly = false;
        $scope.filtersAndSettingsVisible = false;
        $scope.assignmentVisible = true;
      };

      $scope.saveAssignment = function () {
        $scope.assignmentVisible = false;
      };

      getCourses();

    }
  ]
);
