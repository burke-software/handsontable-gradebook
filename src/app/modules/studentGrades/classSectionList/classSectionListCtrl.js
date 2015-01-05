angular.module('gradeBookApp.controllers')
  .controller(
  'classSectionListCtrl',
  [
    '$scope',
    'classSectionFactory',
    '$log',
    function ($scope, classSectionFactory, $log) {

      $scope.classSectionList = [];

      var getClassSectionList = function () {
        classSectionFactory.get().$promise.then(
          function (result){
            $scope.classSectionList = result;
          },
          function (error) {
            $log.error('classSectionListCtrl:getClassSectionList', error);
          }
        )
      };

      getClassSectionList();

    }
  ]
);
