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

      var hideRightColumn = function () {
        $scope.filtersVisible = false;
        $scope.settingsVisible = false;
        $scope.assignmentVisible = false;
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

      $scope.filtersVisible = false;
      $scope.settingsVisible = false;
      $scope.assignmentVisible = false;



      $scope.search = {
        where: 'all',
        what: null
      };

      $scope.activeSection = null;

      $scope.setSearchRange = function (value) {
        $scope.search.where = value;
      };

      $scope.toggleFilter = function () {
        hideRightColumn();
        $scope.filtersVisible = true;
      };

      $scope.toggleSettings = function () {
        hideRightColumn();
        $scope.settingsVisible = true;
      };

      $scope.toggleAssignments = function (readOnly) {
        $scope.readOnly = readOnly;
        hideRightColumn();
        $scope.assignmentVisible = true;
      };

      $scope.editAssignment = function () {
        $scope.readOnly = false;
        hideRightColumn();
        $scope.assignmentVisible = true;
      };

      $scope.saveAssignment = function () {
        $scope.assignmentVisible = false;
      };

      getCourses();

    }
  ]
);
