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

angular.module('gradeBookApp.controllers')
.controller(
  'gradeBookCtrl',
  [
    '$scope',
    'courseFactory',
    'assignmentFactory',
    'schoolYearFactory',
    'sectionFactory',
    '$log',
    function ($scope, courseFactory, assignmentFactory, schoolYearFactory, sectionFactory, $log) {

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
        $scope.notificationVisible = false;
        $scope.colorGuideVisible = false;
        $scope.notificationType = null;
      };

      var getActiveMarkingPeriod = function () {
        schoolYearFactory.get().$promise.then(
          function (result){
            for (var i = 0, len = result.length; i < len; i++) {
              if (result[i].active_year){
                $scope.markingPeriodSet = result[i].markingperiod_set;
                break;
              }
            }
          }
        )
      };

      $scope.getSection = function (sectionId) {
        $scope.activeSection = sectionId;
        sectionFactory.get({sectionId: sectionId}).$promise.then(
          function (result) {
            $scope.sectionSelected = true;
            console.log(result);
            $scope.section = result;
          },
          function (error) {
            $log.error('singleSectionCtrl:getSection', error);
            $scope.sectionSelected = false;
          }
        )
      };

      $scope.sectionSelected = false;

      $scope.section = {};

      $scope.newAssignment = {};

      $scope.markingPeriodSet = [];

      $scope.saveAssignment = function () {
        assignmentFactory.create($scope.newAssignment).$promise.then(
          function (result) {
            console.log(result);
            hideRightColumn();
          }
        )
      };

      $scope.notificationType = null;
      $scope.filtersVisible = false;
      $scope.settingsVisible = false;
      $scope.assignmentVisible = false;
      $scope.multipleAssignments = false;
      $scope.notificationVisible = false;
      $scope.colorGuideVisible = false;


      $scope.search = {
        where: 'all',
        what: null
      };

      $scope.activeSection = null;

      $scope.settings = {};

      $scope.settings.colorHeaders = {};

      $scope.setSearchRange = function (value) {
        $scope.search.where = value;
      };

      $scope.cancel = function () {
        hideRightColumn();
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

      $scope.showMultipleAssignments = function (multiple) {
        $scope.multipleAssignments = multiple;
      };

      $scope.editAssignment = function () {
        $scope.readOnly = false;
        hideRightColumn();
        $scope.assignmentVisible = true;
      };

      $scope.showIconsGuide = function () {
        hideRightColumn();
        $scope.colorGuideVisible = true;
      };

      $scope.showNotificationDescription = function (notificationType) {
        hideRightColumn();
        $scope.notificationType = notificationType;
        $scope.notificationVisible = true;
      };


      getCourses();
      getActiveMarkingPeriod();

    }
  ]
);

angular.module('gradeBookApp.services')
  .factory(
  'assignmentFactory',
  [
    'appConfig',
    '$resource',
    function (appConfig, $resource) {
      return $resource(appConfig.apiUrl + 'assignments/:assignmentId/ ',
        {
          assignmentId: '@assignmentId'
        },
        {
          create: {
            method: 'POST'
          },
          update: {
            method: 'PUT'
          }
        }
      )
    }
  ]
);

angular.module('gradeBookApp.services')
  .factory(
  'categoryFactory',
  [
    'appConfig',
    '$resource',
    '$log',
    function (appConfig, $resource, $log) {
      return $resource(appConfig.apiUrl + '/categories/ ',
        {
        },
        {
         get: {
           method: 'GET',
           isArray: true,
           interceptor: {
             responseError: function (error) {
               $log.error('GET CATEGORY LIST');
               return [
                 {
                   id: 1,
                   name: 'Category 1'
                 },
                 {
                   id: 2,
                   name: 'Category 2'
                 },
                 {
                   id: 3,
                   name: 'Category 3'
                 }
               ];
             }
           }
         }
        }
      )
    }
  ]
);

angular.module('gradeBookApp.services')
  .factory(
  'classSectionFactory',
  [
    'appConfig',
    '$resource',
    '$log',
    function (appConfig, $resource, $log){
      return $resource(appConfig.apiUrl + 'classSection/:sectionId/ ',
        {
          sectionId: '@sectionId'
        },
        {
          getBySection: {
            method: 'GET',
            interceptor: {
              responseError: function (error) {
                $log.error('GET USER LIST WITH ASSIGNMENTS:', error);
                return {
                  id: 1,
                  assignments: [
                    {
                      id:1,
                      name: 'Quiz',
                      weight: 25,
                      category: 1
                    },
                    {
                      id: 2,
                      name: 'Midterm',
                      weight: 50,
                      category: 2
                    },
                    {
                      id: 3,
                      name: 'Project',
                      weight:15,
                      category: 3
                    }
                  ],
                  users: [
                    {
                      id: 1,
                      firstName: 'Ashor',
                      lastName: 'Lior',
                      finalGrade: 0,
                      assignments: [
                        {
                          id: 1,
                          assignmentId:1,
                          value: 26
                        },
                        {
                          id:2,
                          assignmentId:2,
                          value: 35
                        },
                        {
                          id: 3,
                          assignmentId:3,
                          value: 57
                        }
                      ]
                    },
                    {
                      id: 2,
                      firstName: 'Lianna',
                      lastName: 'Congrains',
                      finalGrade: 0,
                      assignments: [
                        {
                          id:4,
                          assignmentId:1,
                          value: 15
                        },
                        {
                          id:5,
                          assignmentId:2,
                          value: 15
                        },
                        {
                          id: 6,
                          assignmentId:3,
                          value: 17
                        }
                      ]
                    },
                    {
                      id: 3,
                      firstName: 'Andy',
                      lastName: 'Dirkse',
                      finalGrade: 0,
                      assignments: [
                        {
                          id:7,
                          assignmentId:1,
                          value: 35
                        },
                        {
                          id:8,
                          assignmentId:2,
                          value: 55
                        },
                        {
                          id: 9,
                          assignmentId:3,
                          value: 58
                        }
                      ]
                    },

                    {
                      id: 5,
                      firstName: 'Jacob',
                      lastName: 'Hammer',
                      finalGrade: 0,
                      assignments: [
                        {
                          id:13,
                          assignmentId:1,
                          value: 26
                        },
                        {
                          id:14,
                          assignmentId:2,
                          value: 51
                        },
                        {
                          id: 15,
                          assignmentId:3,
                          value: 57
                        }
                      ]
                    },
                    {
                      id: 5,
                      firstName: 'Maria',
                      lastName: 'Hadrin',
                      finalGrade: 0,
                      assignments: [
                        {
                          id:10,
                          assignmentId:1,
                          value: 45
                        },
                        {
                          id:11,
                          assignmentId:2,
                          value: 75
                        },
                        {
                          id: 12,
                          assignmentId:3,
                          value: 87
                        }
                      ]
                    },
                    {
                      id: 6,
                      firstName: 'Salma',
                      lastName: 'Ortega',
                      finalGrade: 0,
                      assignments: [
                        {
                          id:10,
                          assignmentId:1,
                          value: 45
                        },
                        {
                          id:11,
                          assignmentId:2,
                          value: 75
                        },
                        {
                          id: 12,
                          assignmentId:3,
                          value: 87
                        }
                      ]
                    },
                    {
                      id: 14,
                      firstName: 'Vincent',
                      lastName: 'Rose',
                      finalGrade: 0,
                      assignments: [
                        {
                          id:10,
                          assignmentId:1,
                          value: 45
                        },
                        {
                          id:11,
                          assignmentId:2,
                          value: 75
                        },
                        {
                          id: 12,
                          assignmentId:3,
                          value: 87
                        }
                      ]
                    },
                    {
                      id: 24,
                      firstName: 'Allen',
                      lastName: 'West',
                      finalGrade: 0,
                      assignments: [
                        {
                          id:10,
                          assignmentId:1,
                          value: 45
                        },
                        {
                          id:11,
                          assignmentId:2,
                          value: 75
                        },
                        {
                          id: 12,
                          assignmentId:3,
                          value: 87
                        }
                      ]
                    }
                  ]
                }
              }
            }
          },
          get: {
            method: 'GET',
            isArray: true,
            interceptor: {
              responseError: function (error) {
                $log.error('GET CLASSES AND SECTIONS:', error);
                return [
                  {
                    name: 'Algebra II',
                    sections: [
                      {
                        id: 1,
                        name: 'Period 1'
                      },
                      {
                        id: 2,
                        name: 'Period 2'
                      },
                      {
                        id:3,
                        name: 'Period 3'
                      },
                      {
                        id: 4,
                        name: 'Period 4'
                      }
                    ]
                  },
                  {
                    name: 'Algebra I',
                    sections: [
                      {
                        id: 5,
                        name: 'Period 1'
                      },
                      {
                        id: 6,
                        name: 'Period 2'
                      }
                    ]
                  },
                  {
                    name: 'Geometry 10',
                    sections: [
                      {
                        id: 7,
                        name: 'Period 1'
                      },
                      {
                        id: 8,
                        name: 'Period 2'
                      }
                    ]
                  }
                ]
              }
            }
          }
        }
      )
    }
  ]
);

angular.module('gradeBookApp.services')
  .factory(
  'courseFactory',
  [
    'appConfig',
    '$resource',
    function (appConfig, $resource) {
      return $resource(appConfig.apiUrl + 'courses/:courseId/ ',
        {
          courseId: '@courseId'
        },
        {
          create: {
            method: 'POST'
          },
          update: {
            method: 'PUT'
          }
        }
      )
    }
  ]
);

/**
 * Created by jkl on 05.01.15.
 */
angular.module('gradeBookApp.services')
  .factory(
  'gradeFactory',
  [
    'appConfig',
    '$resource',
    function (appConfig, $resource) {
      return $resource(appConfig.apiUrl + 'grades/:gradeId/ ',
        {
          gradeId: '@gradeId'
        },
        {
          create: {
            method: 'POST'

          },

          update: {
            method: 'PUT'

          }
        }
      )
    }
  ]
);

angular.module('gradeBookApp.services')
  .factory(
  'schoolYearFactory',
  [
    'appConfig',
    '$resource',
    function (appConfig, $resource) {
      return $resource(appConfig.apiUrl + 'school_years/:schoolYearId/ ',
        {
          schoolYearId: '@schoolYearId'
        },
        {
          get: {
            isArray: true
          },
          create: {
            method: 'POST'
          },
          update: {
            method: 'PUT'
          }
        }
      )
    }
  ]
);

angular.module('gradeBookApp.services')
  .factory(
  'sectionFactory',
  [
    'appConfig',
    '$resource',
    function (appConfig, $resource) {
      return $resource(appConfig.apiUrl + 'sections/:sectionId/ ',
        {
          sectionId: '@sectionId'
        },
        {
          create: {
            method: 'POST'
          },
          update: {
            method: 'PUT'
          }
        }
      )
    }
  ]
);

angular.module('gradeBookApp.services')
  .factory(
  'studentFactory',
  [
    'appConfig',
    '$resource',
    '$log',
    function (appConfig, $resource, $log) {
      return $resource(appConfig.apiUrl + '/student/:studentId/ ',
        {
          studentId: '@studentId'
        },
        {
          update: {
            method: 'PUT'
          },
          get: {
            method: 'GET',
            interceptor: {
              responseError: function (error) {
                $log.error('GET SINGLE USER:', error);
                return {
                  id: 1,
                  firstName: 'Ashor',
                  lastName: 'Lior',
                  finalGrade: 0,
                  assignments: [
                    {
                      id: 1,
                      assignmentId:1,
                      value: 26
                    },
                    {
                      id:2,
                      assignmentId:2,
                      value: 35
                    },
                    {
                      id: 3,
                      assignmentId:3,
                      value: 57
                    }
                  ]
                }
              }
            }
          }
        }
      )
    }
  ]
);

angular.module('gradeBookApp.templates', ['gradebook/gradebook.html']);

angular.module("gradebook/gradebook.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("gradebook/gradebook.html",
    "<div id=\"gradebook\">\n" +
    "\n" +
    "  <div class=\"col-sm-3 hidden-xs left-filter\">\n" +
    "\n" +
    "    <h2>Gradebook</h2>\n" +
    "\n" +
    "    <div class=\"form-group\">\n" +
    "      <ul class=\"nav nav-pills\">\n" +
    "        <li data-ng-class=\"{'active': search.where === 'all'}\">\n" +
    "          <a data-ng-click=\"setSearchRange('all')\">All</a>\n" +
    "        </li>\n" +
    "        <li data-ng-class=\"{'active': search.where === 'teacher'}\">\n" +
    "          <a data-ng-click=\"setSearchRange('teacher')\">Teacher</a>\n" +
    "        </li>\n" +
    "        <li data-ng-class=\"{'active': search.where === 'year'}\">\n" +
    "          <a data-ng-click=\"setSearchRange('year')\">Year</a>\n" +
    "        </li>\n" +
    "        <li data-ng-class=\"{'active': search.where === 'student'}\">\n" +
    "          <a data-ng-click=\"setSearchRange('student')\">Student</a>\n" +
    "        </li>\n" +
    "      </ul>\n" +
    "      <input type=\"text\" class=\"form-control\" placeholder=\"Type to filter\">\n" +
    "    </div>\n" +
    "\n" +
    "\n" +
    "    <ul class=\"nav\">\n" +
    "\n" +
    "      <li data-ng-repeat=\"course in courses\">\n" +
    "        {{course.fullname}}\n" +
    "        <ul class=\"nav\">\n" +
    "          <li data-ng-repeat=\"section in course.sections\" data-ng-class=\"{'active': section.id === activeSection}\">\n" +
    "            <a data-ng-click=\"getSection(section.id)\">{{section.name}}</a>\n" +
    "          </li>\n" +
    "        </ul>\n" +
    "      </li>\n" +
    "\n" +
    "      <li>Math 101\n" +
    "        <ul class=\"nav\">\n" +
    "          <li>\n" +
    "            <a href=\"\">Group A</a>\n" +
    "          </li>\n" +
    "          <li>\n" +
    "            <a href=\"\">Group B</a>\n" +
    "          </li>\n" +
    "          <li>\n" +
    "            <a href=\"\">Gruop C</a>\n" +
    "          </li>\n" +
    "        </ul>\n" +
    "      </li>\n" +
    "      <li>Math 102\n" +
    "        <ul class=\"nav\">\n" +
    "          <li>\n" +
    "            <a href=\"\">Group A</a>\n" +
    "          </li>\n" +
    "          <li>\n" +
    "            <a href=\"\">Group B</a>\n" +
    "          </li>\n" +
    "        </ul>\n" +
    "      </li>\n" +
    "    </ul>\n" +
    "  </div>\n" +
    "\n" +
    "  <div class=\"col-sm-9 col-sm-offset-3\">\n" +
    "    <h2>Math 101: Group A</h2>\n" +
    "\n" +
    "    <div class=\"col-xs-12\">\n" +
    "      <div class=\"pull-left\">\n" +
    "        <button class=\"btn btn-primary visible-xs\" data-ng-click=\"showSearch()\">Show search</button>\n" +
    "        <button class=\"btn btn-primary\" data-ng-click=\"toggleAssignments(false)\"><i class=\"fa fa-plus\"></i>&nbsp;Add Assignment(s)</button>\n" +
    "        <button class=\"btn btn-primary\" data-ng-click=\"toggleFilter()\"><i class=\"fa fa-filter\"></i>&nbsp;Filters</button>\n" +
    "        <button class=\"btn btn-primary\" data-ng-click=\"toggleSettings()\"><i class=\"fa fa-sliders\"></i>&nbsp;Settings</button>\n" +
    "        <!--<button class=\"btn btn-primary\" data-ng-click=\"toggleAssignments(true)\">ReadOnly test</button>-->\n" +
    "      </div>\n" +
    "      <div class=\"pull-left\" style=\"padding-left: 15px\">\n" +
    "        <p style=\"margin-bottom: -3px; margin-top:-1px\">Click on an assignment to view and edit details</p>\n" +
    "        <a data-ng-click=\"showIconsGuide()\">What do the icons and colors in the cells mean?</a>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "    <div class=\"col-xs-12\" style=\"overflow: auto; padding-bottom: 20px;\">\n" +
    "\n" +
    "      <hot-table\n" +
    "        afterChange=\"afterChange\" ,\n" +
    "        afterGetColHeader=\"afterGetColHeader\" ,\n" +
    "        rowHeaders=\"true\"\n" +
    "        colHeaders=\"true\"\n" +
    "        datarows=\"users\"\n" +
    "        columns=\"columns\"\n" +
    "        fixedColumnsLeft=\"2\"\n" +
    "        minSpareRows=\"1\"\n" +
    "        minSpareCols=\"1\">\n" +
    "      </hot-table>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "\n" +
    "  <div class=\"col-xs-3 right-settings\"  data-ng-class=\"{'hidden':!assignmentVisible}\">\n" +
    "    <h2 data-ng-if=\"!readOnly\">\n" +
    "      <span data-ng-if=\"!multipleAssignments\">Add Assignment</span>\n" +
    "      <span data-ng-if=\"multipleAssignments\">Add Assignments</span>\n" +
    "    </h2>\n" +
    "    <h2 data-ng-if=\"readOnly\">View Assignment</h2>\n" +
    "    <form>\n" +
    "      <div class=\"form-group\" data-ng-init=\"multipleAssignments = false\">\n" +
    "        <div class=\"col-xs-12 two-states\">\n" +
    "          <button class=\"col-xs-6 btn btn-default\" data-ng-class=\"{'btn-primary': multipleAssignments == false}\" data-ng-click=\"multipleAssignments = false\">Single</button>\n" +
    "          <button class=\"col-xs-6 btn btn-default\" data-ng-class=\"{'btn-primary': multipleAssignments == true}\" data-ng-click=\"multipleAssignments = true\">Multiple</button>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "\n" +
    "      <div class=\"form-group\" data-ng-if=\"multipleAssignments\">\n" +
    "        <label for=\"howManyAssignments\">How many assignments?</label>\n" +
    "        <input id=\"howManyAssignments\" class=\"form-control\" type=\"text\">\n" +
    "      </div>\n" +
    "\n" +
    "      <div class=\"form-group\">\n" +
    "        <label for=\"name\">Name</label>\n" +
    "        <input id=\"name\" class=\"form-control\" type=\"text\" data-ng-if=\"!readOnly\" data-ng-model=\"newAssignment.name\">\n" +
    "        <p data-ng-if=\"readOnly\">Super long assignment</p>\n" +
    "      </div>\n" +
    "      <div class=\"form-group\">\n" +
    "        <label for=\"date\">Date</label>\n" +
    "        <input id=\"date\" class=\"form-control\" type=\"date\"  data-ng-if=\"!readOnly\" data-ng-model=\"newAssignment.date\">\n" +
    "        <p data-ng-if=\"readOnly\">1/1/15</p>\n" +
    "      </div>\n" +
    "      <div class=\"form-group\">\n" +
    "        <label for=\"maxPoints\">Max Points</label>\n" +
    "        <input id=\"maxPoints\" class=\"form-control\" type=\"number\" data-ng-if=\"!readOnly\" data-ng-model=\"newAssignment.points_possible\">\n" +
    "        <p data-ng-if=\"readOnly\">75</p>\n" +
    "      </div>\n" +
    "      <div class=\"form-group\">\n" +
    "        <label for=\"assignmentCategory\">Category</label>\n" +
    "        <select id=\"assignmentCategory\" class=\"form-control\" data-ng-if=\"!readOnly\" data-ng-model=\"newAssignment.category\"></select>\n" +
    "        <p data-ng-if=\"readOnly\">Category 1</p>\n" +
    "      </div>\n" +
    "      <div class=\"form-group\">\n" +
    "        <label for=\"assignmentType\">Assignment Type</label>\n" +
    "        <select id=\"assignmentType\" class=\"form-control\" data-ng-if=\"!readOnly\" data-ng-model=\"newAssignment.assignment_type\"></select>\n" +
    "        <p data-ng-if=\"readOnly\">Homework</p>\n" +
    "      </div>\n" +
    "      <div class=\"form-group\">\n" +
    "        <label for=\"markingPeriod\">Marking Period</label>\n" +
    "        <select id=\"markingPeriod\" class=\"form-control\" data-ng-if=\"!readOnly\" data-ng-model=\"newAssignment.marking_period\" data-ng-options=\"period.id as period.name for period in markingPeriodSet\">\n" +
    "        </select>\n" +
    "        <p data-ng-if=\"readOnly\">MAth101: Group A</p>\n" +
    "      </div>\n" +
    "      <div class=\"form-group\">\n" +
    "        <label for=\"standard\">Standard</label>\n" +
    "        <select id=\"standard\" class=\"form-control\" data-ng-if=\"!readOnly\"></select>\n" +
    "        <p data-ng-if=\"readOnly\">Normal</p>\n" +
    "      </div>\n" +
    "      <div class=\"form-group\">\n" +
    "        <label for=\"description\">Description</label>\n" +
    "        <textarea id=\"description\" class=\"form-control\" data-ng-if=\"!readOnly\" data-ng-model=\"newAssignment.description\"></textarea>\n" +
    "        <p data-ng-if=\"readOnly\">Lorem ipsum dolor sitmet, conceptuir elit ascit.</p>\n" +
    "      </div>\n" +
    "      <button type=\"button\" class=\"btn btn-primary\" data-ng-if=\"!readOnly\" data-ng-click=\"saveAssignment()\">Add to Gradebook</button>\n" +
    "      <button type=\"button\" class=\"btn btn-primary\" data-ng-if=\"!readOnly\" data-ng-click=\"cancel()\">Cancel</button>\n" +
    "      <button type=\"button\" class=\"btn btn-primary\" data-ng-if=\"readOnly\" data-ng-click=\"editAssignment()\">Edit Assignment</button>\n" +
    "    </form>\n" +
    "  </div>\n" +
    "\n" +
    "  <div class=\"col-xs-3 right-settings\" data-ng-class=\"{'hidden':!filtersVisible}\">\n" +
    "    <h2>Filters</h2>\n" +
    "\n" +
    "    <form>\n" +
    "      <div class=\"form-group\">\n" +
    "        <label for=\"currentMarkingPeriod\">Marking Period</label>\n" +
    "        <select class=\"form-control\" id=\"currentMarkingPeriod\">\n" +
    "        </select>\n" +
    "      </div>\n" +
    "      <div class=\"form-group\">\n" +
    "        <label for=\"category\">Select Category</label>\n" +
    "        <select class=\"form-control\" id=\"category\"></select>\n" +
    "      </div>\n" +
    "      <div class=\"form-group\">\n" +
    "        <label for=\"currentAssignmentType\">Current Assignment Type</label>\n" +
    "        <select class=\"form-control\" id=\"currentAssignmentType\"></select>\n" +
    "      </div>\n" +
    "      <div class=\"form-group\">\n" +
    "        <label for=\"filterStandard\">Standard(s)</label>\n" +
    "        <select class=\"form-control\" id=\"filterStandard\"></select>\n" +
    "      </div>\n" +
    "\n" +
    "      <div class=\"form-group\">\n" +
    "        <label for=\"studentCohort\">Student Cohort</label>\n" +
    "        <select class=\"form-control\" id=\"studentCohort\"></select>\n" +
    "      </div>\n" +
    "\n" +
    "      <div class=\"form-group\">\n" +
    "        <label for=\"assignmentName\">Filter by Assignment Name:</label>\n" +
    "        <input type=\"text\" id=\"assignmentName\" class=\"form-control\">\n" +
    "      </div>\n" +
    "\n" +
    "      <div class=\"form-group\">\n" +
    "        <label>Filter by Date Range</label>\n" +
    "        <div class=\"form-inline\">\n" +
    "          <input type=\"text\" class=\"form-control\">\n" +
    "          to\n" +
    "          <input type=\"text\" class=\"form-control\">\n" +
    "        </div>\n" +
    "      </div>\n" +
    "      <button type=\"submit\" class=\"btn btn-primary\">Filter by Selected Options</button>\n" +
    "      <button class=\"btn btn-primary\" data-ng-click=\"cancel()\">Close</button>\n" +
    "    </form>\n" +
    "\n" +
    "\n" +
    "\n" +
    "\n" +
    "  </div>\n" +
    "\n" +
    "  <div class=\"col-xs-3 right-settings\" data-ng-class=\"{'hidden':!settingsVisible}\">\n" +
    "    <h2>Settings</h2>\n" +
    "\n" +
    "    <div class=\"form-group clearfix\" data-ng-init=\"settings.position = 'left'\">\n" +
    "      <label>Final Grades Position</label>\n" +
    "      <div class=\"col-xs-12 two-states\">\n" +
    "        <button class=\"col-xs-6 btn btn-default\" data-ng-class=\"{'btn-primary': settings.position == 'left'}\" data-ng-click=\"settings.position = 'left'\">Left</button>\n" +
    "        <button class=\"col-xs-6 btn btn-default\" data-ng-class=\"{'btn-primary': settings.position == 'right'}\" data-ng-click=\"settings.position = 'right'\">Right</button>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"form-group clearfix\" data-ng-init=\"settings.sort = 'newest'\">\n" +
    "      <label>Sort Entries</label>\n" +
    "\n" +
    "      <div class=\"col-xs-12\">\n" +
    "\n" +
    "        <div class=\"radio\">\n" +
    "          <label>\n" +
    "            <input type=\"radio\" value=\"1\" name=\"optionsRadios\">\n" +
    "            Date\n" +
    "          </label>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"radio\">\n" +
    "          <label>\n" +
    "            <input type=\"radio\" value=\"2\" name=\"optionsRadios\">\n" +
    "            Name\n" +
    "          </label>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"radio\">\n" +
    "          <label>\n" +
    "            <input type=\"radio\" value=\"3\" name=\"optionsRadios\">\n" +
    "            Category\n" +
    "          </label>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"radio\">\n" +
    "          <label>\n" +
    "            <input type=\"radio\" value=\"4\" name=\"optionsRadios\">\n" +
    "            Assignment Type\n" +
    "          </label>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"radio\">\n" +
    "          <label>\n" +
    "            <input type=\"radio\" value=\"5\" name=\"optionsRadios\">\n" +
    "            Standard\n" +
    "          </label>\n" +
    "        </div>\n" +
    "\n" +
    "      </div>\n" +
    "\n" +
    "      <div class=\"col-xs-12 two-states\">\n" +
    "        <button class=\"col-xs-6 btn btn-default\" data-ng-class=\"{'btn-primary': settings.sort == 'oldest'}\" data-ng-click=\"settings.sort = 'oldest'\">Oldest First</button>\n" +
    "        <button class=\"col-xs-6 btn btn-default\" data-ng-class=\"{'btn-primary': settings.sort == 'newest'}\" data-ng-click=\"settings.sort = 'newest'\">Newest First</button>\n" +
    "      </div>\n" +
    "\n" +
    "\n" +
    "\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"form-group clearfix\">\n" +
    "      <div class=\"checkbox\">\n" +
    "        <label>\n" +
    "          <input type=\"checkbox\" value=\"\" name=\"largeScreen\">\n" +
    "          Always Show Right Sidebar on Large Screens\n" +
    "        </label>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"form-group clearfix\">\n" +
    "      <label>Colored headers</label>\n" +
    "      <div class=\"col-xs-12\">\n" +
    "\n" +
    "        <div class=\"radio\">\n" +
    "          <label>\n" +
    "            <input type=\"radio\" value=\"category\" data-ng-model=\"settings.colorHeaders.type\" name=\"coloredHeaders\">\n" +
    "            By Category\n" +
    "          </label>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"radio\">\n" +
    "          <label>\n" +
    "            <input type=\"radio\" value=\"name\"  data-ng-model=\"settings.colorHeaders.type\" name=\"coloredHeaders\">\n" +
    "            By Name\n" +
    "          </label>\n" +
    "        </div>\n" +
    "        <div class=\"col-xs-12\" data-ng-if=\"settings.colorHeaders.type == 'name'\">\n" +
    "          <div class=\"checkbox\">\n" +
    "            <label>\n" +
    "              <input type=\"checkbox\" value=\"\">\n" +
    "              <span class=\"color-checker pink\"></span>\n" +
    "              <span class=\"pull-right\">Precission and Accuracy</span>\n" +
    "            </label>\n" +
    "          </div>\n" +
    "\n" +
    "          <div class=\"checkbox\">\n" +
    "            <label>\n" +
    "              <input type=\"checkbox\" value=\"\">\n" +
    "              <span class=\"color-checker green\"></span>\n" +
    "\n" +
    "              <span class=\"pull-right\">Standards</span>\n" +
    "            </label>\n" +
    "          </div>\n" +
    "\n" +
    "          <div class=\"checkbox\">\n" +
    "            <label>\n" +
    "              <input type=\"checkbox\" value=\"\">\n" +
    "              <span class=\"color-checker orange\"></span>\n" +
    "\n" +
    "              <span class=\"pull-right\">Engagement</span>\n" +
    "            </label>\n" +
    "          </div>\n" +
    "\n" +
    "          <div class=\"checkbox\">\n" +
    "            <label>\n" +
    "              <input type=\"checkbox\" value=\"\" >\n" +
    "              <span class=\"color-checker blue\"></span>\n" +
    "              <span class=\"pull-right\">Assignment Competition</span>\n" +
    "            </label>\n" +
    "          </div>\n" +
    "\n" +
    "          <div class=\"checkbox\">\n" +
    "            <label>\n" +
    "              <input type=\"checkbox\" value=\"\" >\n" +
    "              <span class=\"color-checker red\"></span>\n" +
    "              <span class=\"pull-right\">Daily practice</span>\n" +
    "            </label>\n" +
    "          </div>\n" +
    "\n" +
    "        </div>\n" +
    "\n" +
    "\n" +
    "        <div class=\"radio pull-left\">\n" +
    "          <label>\n" +
    "            <input type=\"radio\" value=\"assignmentType\"  data-ng-model=\"settings.colorHeaders.type\" name=\"coloredHeaders\">\n" +
    "            By Assignment Type\n" +
    "          </label>\n" +
    "        </div>\n" +
    "\n" +
    "\n" +
    "      </div>\n" +
    "\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"form-group clearfix\">\n" +
    "      <label>Show in header cells</label>\n" +
    "      <div class=\"col-xs-12\">\n" +
    "\n" +
    "        <div class=\"checkbox\">\n" +
    "          <label>\n" +
    "            <input type=\"checkbox\" value=\"\">\n" +
    "            Category\n" +
    "          </label>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"checkbox\">\n" +
    "          <label>\n" +
    "            <input type=\"checkbox\" value=\"\">\n" +
    "            Assignment Type\n" +
    "          </label>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"checkbox\">\n" +
    "          <label>\n" +
    "            <input type=\"checkbox\" value=\"\">\n" +
    "            Name\n" +
    "          </label>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"checkbox\">\n" +
    "          <label>\n" +
    "            <input type=\"checkbox\" value=\"\" >\n" +
    "            Standard\n" +
    "          </label>\n" +
    "        </div>\n" +
    "\n" +
    "      </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"form-group clearfix\">\n" +
    "      <label>Grade input method</label>\n" +
    "      <p>Schooldriver Gradebook <a data-ng-click=\"\">(change)</a></p>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"form-group clearfix\">\n" +
    "      <label>Display names</label>\n" +
    "      <p>First Last <a data-ng-click=\"\">(change)</a></p>\n" +
    "    </div>\n" +
    "\n" +
    "    <button class=\"btn btn-primary\" data-ng-click=\"cancel()\">Close</button>\n" +
    "  </div>\n" +
    "\n" +
    "  <div class=\"col-xs-3 right-settings\" data-ng-class=\"{'hidden': !colorGuideVisible}\">\n" +
    "    <h2>Icon/Color Guide</h2>\n" +
    "\n" +
    "    <dl class=\"dl-horizontal\">\n" +
    "\n" +
    "      <dt data-ng-click=\"showNotificationDescription('saving')\"><i class=\"fa fa-spinner\"></i></dt>\n" +
    "      <dd data-ng-click=\"showNotificationDescription('saving')\">Data is saving</dd>\n" +
    "\n" +
    "      <dt data-ng-click=\"showNotificationDescription('general')\"><i class=\"fa fa-flag\"></i></dt>\n" +
    "      <dd data-ng-click=\"showNotificationDescription('general')\">General notification</dd>\n" +
    "\n" +
    "      <dt data-ng-click=\"showNotificationDescription('error')\"><i class=\"fa fa-times-circle\"></i></dt>\n" +
    "      <dd data-ng-click=\"showNotificationDescription('error')\">Error notification</dd>\n" +
    "\n" +
    "    </dl>\n" +
    "\n" +
    "    <i>Click the notification to get more information.</i>\n" +
    "\n" +
    "    <button class=\"btn btn-primary\" data-ng-click=\"cancel()\">Close</button>\n" +
    "  </div>\n" +
    "\n" +
    "  <div class=\"col-xs-3 right-settings\" data-ng-class=\"{'hidden': !notificationVisible}\">\n" +
    "    <div data-ng-if=\"notificationType === 'saving'\">\n" +
    "      <h2><i class=\"fa fa-spinner\"></i> Data is saving</h2>\n" +
    "      <p>sda dasd asdadadasd asdasdasd asdasdad asdada</p>\n" +
    "    </div>\n" +
    "\n" +
    "    <div data-ng-if=\"notificationType === 'general'\">\n" +
    "      <h2><i class=\"fa fa-flag\"></i> Possible input error</h2>\n" +
    "      <p>Max points for this entry is 10, but you entered 100. This may be incorrec</p>\n" +
    "    </div>\n" +
    "\n" +
    "    <div data-ng-if=\"notificationType === 'error'\">\n" +
    "      <h2><i class=\"fa fa-times-circle\"></i> Lorem Ipsum</h2>\n" +
    "      <p>sdad asdasdasdas dasdasdada dasdasdad asdasda</p>\n" +
    "    </div>\n" +
    "\n" +
    "    <button class=\"btn btn-primary\" data-ng-click=\"showIconsGuide()\">Back</button>\n" +
    "    <button class=\"btn btn-primary\" data-ng-click=\"cancel()\">Close</button>\n" +
    "\n" +
    "  </div>\n" +
    "\n" +
    "</div>\n" +
    "");
}]);
