'use strict';

angular.module('gradeBookApp', [
  'ngRoute',
  'ngResource',
  'ngCookies',
  'ui.bootstrap',
  'ngHandsontable',
  'gradeBookApp.controllers',
  'gradeBookApp.services',
  'gradeBookApp.templates'
])
  .config(
  [
    '$provide',
    '$routeProvider',
    function ($provide, $routeProvider) {
      $provide.factory('appConfig', function () {
        return {
          apiUrl: ''
        }
      });

      $routeProvider.
        when('/login', {

        })
        .when('/students',{

        })
        .when('/attendance',{

        })
        .when('/courses',{

        })
        .when('/cswp',{

        })
        .when('/discipline',{

        })
        .when('/counseling',{

        })
        .when('/students/classSections',{
          controller: 'classSectionListCtrl',
          templateUrl: 'studentGrades/classSectionList/classSectionList.html'
        })
        .when('/students/classSections/:sectionId',{
          controller: 'singleSectionCtrl',
          templateUrl: 'studentGrades/singleSection/singleSection.html'
        })
        .otherwise({
          redirectTo: '/students/classSections'
        });
    }
  ]
);


angular.module('gradeBookApp.services', []);
angular.module('gradeBookApp.controllers',[]);
