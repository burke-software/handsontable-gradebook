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
          apiUrl: 'http://192.168.59.103:8000/api/'
        }
      });

      $routeProvider.
        when('/gradebook/',{
          controller: 'gradeBookCtrl',
          templateUrl: 'gradebook/gradebook.html'
        })
        //.when('/gradebook/',{
        //  controller: 'coursesCtrl',
        //  templateUrl: 'courses/courses.html'
        //})
        .when('/gradebook/sections/:sectionId',{
          controller: 'singleSectionCtrl',
          templateUrl: 'singleSection/singleSection.html'
        });

    }
  ]
).run(
  [
    '$http',
    '$cookies',
    function ($http,$cookies){
      $http.defaults.headers.common['X-CSRFToken'] = $cookies.csrftoken;
    }
  ]
);
angular.module('gradeBookApp.services', []);
angular.module('gradeBookApp.controllers',[]);
