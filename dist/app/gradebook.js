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
  'coursesCtrl',
  [
    '$scope',
    'courseFactory',
    function ($scope,  courseFactory) {

      $scope.courses = [];

      $scope.select = {};

      $scope.years = [];

      $scope.teachers = [
        "Teacher 1", "Teacher 2", "Teacher 3"
      ];

      $scope.$watch('select.teacher',function () {
        if ($scope.select.year && $scope.select.teacher) {
          getCourses();
        }
      });

      $scope.$watch('select.year',function () {
        if ($scope.select.year && $scope.select.teacher) {
          getCourses();
        }
      });

      var createYears = function () {
        for(var i = 2000, j = 2015;  i < j; i++) {
          $scope.years.push(i);
        }
      };

      createYears();

      var getCourses = function () {
        courseFactory.get().$promise.then(
          function (result) {
            $scope.courses = result['results'];
          }
        )
      };
    }
  ]
);

angular.module('gradeBookApp.controllers')
.controller(
  'gradeBookCtrl',
  [
    '$scope',
    'courseFactory',
    'assignmentFactory',
    'schoolYearFactory',
    'classSectionFactory',
    '$log',
    function ($scope, courseFactory, assignmentFactory, schoolYearFactory, classSectionFactory, $log) {

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

      var getActiveMarkingPeriod = function () {
        schoolYearFactory.get().$promise.then(
          function (result){
            for (var i = 0, len = result.length; i < len; i++) {
              if (result[i].active_year){
                $scope.marketingPeriodSet = result[i].markingperiod_set;
                break;
              }
            }
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

      $scope.newAssignment = {};

      $scope.marketingPeriodSet = [];

      $scope.saveAssignment = function () {
        assignmentFactory.create($scope.newAssignment).$promise.then(
          function (result) {
            console.log(result);
            hideRightColumn();
          }
        )
      };

      $scope.filtersVisible = false;
      $scope.settingsVisible = false;
      $scope.assignmentVisible = false;
      $scope.multipleAssignments = false;


      $scope.search = {
        where: 'all',
        what: null
      };

      $scope.activeSection = null;

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



      getCourses();
      getActiveMarkingPeriod();

    }
  ]
);

angular.module('gradeBookApp.controllers')
  .controller(
  'singleSectionCtrl',
  [
    '$scope',
    'classSectionFactory',
    'assignmentFactory',
    'gradeFactory',
    'studentFactory',
    '$routeParams',
    '$modal',
    '$log',
    function ($scope, classSectionFactory, assignmentFactory, gradeFactory, studentFactory, $routeParams, $modal, $log) {
      $scope.sectionId = $routeParams.sectionId;

      if (!$scope.sectionId) {
        return;
      }


      $scope.originalDataSource = [];
      $scope.users = [];
      $scope.columns = [];

      $scope.afterChange = function (change, source) {
        if (source === 'loadData') {
          return;
        }
        serveChanges(change[0]);
      };

      $scope.afterGetColHeader = function (col, TH) {
        // FOR FINAL GRADE COL HEADER
        if (col === 2) {
          var adjustButton = buildButton('fa fa-wrench');
          Handsontable.Dom.addEvent(adjustButton,'click', function (e){
            adjustGradeSettings();
          });
          TH.firstChild.appendChild(adjustButton);
        }

        if (col >= staticColHeadersCount) {
          if (col === _assignmentArray.length + staticColHeadersCount) {
            var addButton = buildButton('fa fa-plus-square');
            Handsontable.Dom.addEvent(addButton,'click', function (e){
              addNewAssignment();
            });
            TH.firstChild.appendChild(addButton);
          } else {
            var deleteButton = buildButton('fa fa-minus-square');
            Handsontable.Dom.addEvent(deleteButton, 'click', function () {
              var conf = confirm('Are you sure you want to delete assignment');
              if (conf) {
                deleteAssignment(col);
              }
            });
            TH.firstChild.appendChild(deleteButton);
          }
        }

      };

      var staticColHeadersCount = 3; //firstName, lastName, finalGrade

      var adjustGradeSettings = function () {
        console.log('adjustGradeSettings');

        var modalInstance = $modal.open({
          windowClass: "modal fade in active",
          templateUrl:'studentGrades/singleSection/_adjustGradeSettings.html',
          controller: 'adjustGradeSettingsCtrl',
          resolve: {
            assignments: function () {
              return $scope.originalDataSource.assignments;
            }
          }
        });
      };

      var addNewAssignment = function () {
        console.log('addNewAssignment');

        var modalInstance = $modal.open({
          windowClass: "modal fade in active",
          templateUrl:'studentGrades/singleSection/_addNewAssignment.html',
          controller: 'addNewAssignmentCtrl'
        });

        modalInstance.result.then(
          function (assignment) {

            assignmentFactory.create(assignment).$promise.then(
              function (result) {
                // UPDATE ORIGINAL DATASOURCE
                $scope.originalDataSource.assignments.push(result);

                prepareAssignmentArray($scope.originalDataSource.assignments);

                console.log(result);
                console.log($scope.columns);
                console.log($scope.originalDataSource);
              },
              function (error) {
                $log.error('singleSectionCtrl.addNewAssignment', error);
              }
            );

          },
          function () {
            $log.info('Modal dismissed at: ' + new Date());
          }
        );
      };

      var deleteAssignment = function (column) {
        var assignmentId = _assignmentArray[column - staticColHeadersCount];
        assignmentFactory.delete({assignmentId: assignmentId}).$promise.then(
          function (result) {
            $log.log('AFTER DELETE WE SHOULD UPDATE WHOLE DATASET');
            getSection();
          },
          function (error) {
            $log.error('singleSectionCtrl.deleteAssignment:', error);
          }
        )
      };

      var buildButton = function (className) {
        //var button = document.createElement('BUTTON');
        var icon = document.createElement('i');
        icon.className = className + ' button';
        //button.appendChild(icon);
        //button.className = 'glyphicon ' + className;
        return icon;
      };

      /***
       * GET DEFAULT COLUMNS - FIRST THREE
       * @return {{data: string, title: string, readOnly: boolean}[]}
       */
      var defaultColumns = function () {
        return [
          {
            data: 'firstName',
            title: 'First Name',
            readOnly: true
          },
          {
            data: 'lastName',
            title: 'Last Name',
            readOnly: true
          },
          {
            data: 'finalGrade',
            title: 'Final Grade',
            readOnly: true
          }
        ]
      };

      /***
       * GET ORIGINAL ID FOR ASSIGNMENT BASED ON ASSIGNMENT TEMPORARY NAME
       * @param assignmentName
       * @return {Number}
       */
      var getAssignmentIndex = function (assignmentName) {
        var id = assignmentName.split('assignment_')[1];
        return parseInt(id, 10);
      };

      /***
       * UPDATE ORIGINAL DATASOURCE - TO KEEP ALL DATA UP TO DATE
       * @param studentId
       * @param studentObject
       */
      var updateOriginalDataSource = function (studentId, studentObject) {
        for (var i = 0, len = $scope.originalDataSource.length; i < len;i++) {
          var student = $scope.originalDataSource[i];
          if (student.id === studentId) {
            student = studentObject;
            break;
          }
        }
      };

      /***
       * UPDATE DATASOURCE WHICH IS MAIN SOURCE FOR HANDSONTABLE
       * @param studentId
       * @param studentObject
       */
      var updateTransformedDataSource = function (studentId, studentObject) {
        for (var i = 0, len = $scope.users.length; i < len;i++) {
          if ($scope.users[i].id === studentId) {
            $scope.users[i] = studentObject;
            break;
          }
        }
      };

      /***
       * GET SINGLE STUDENT AFTER UPDATE
       * @param studentId
       */
      var getSingleStudent = function (studentId) {
        studentFactory.get({studentId: studentId}).$promise.then(
          function (result) {
            //console.log(result);
            updateOriginalDataSource(studentId, result);
            var transformedStudent = prepareSingleStudent(result);
            updateTransformedDataSource(studentId, transformedStudent);
          },
          function (error) {
            $log.error('singleSectionCtrl.getSingleStudent', error);
          }
        )
      };

      /***
       * UPDATE SINGLE GRADE IN ASSIGNMENT
       * Make update request to backend
       * @param assignment
       * @param studentId
       */
      var updateGrade = function (item, studentId) {
        gradeFactory.update({gradeId: item.id},item).$promise.then(
          function (result) {
            console.log(result);
            getSingleStudent(studentId);
          },
          function (error) {
            $log.error('singleSectionCtrl.updateGrade', error);
          }
        );
      };

      var addGrade = function (item, studentId) {
        gradeFactory.create(item).$promise.then(
          function (result) {
            console.log(result);
            getSingleStudent(studentId);
          },
          function (error) {
            $log.error('singleSectionCtrl.addGrade', error);
          }
        )
      };

      /***
       * SERVE CHANGES
       * Fire all methods after cell change
       * @param change
       */
      var serveChanges = function (change) {
        console.log('serveChange');
        var userIndex = change[0],
            assignmentIndex = getAssignmentIndex(change[1]),
            oldValue = change[2],
            newValue = change[3];

        console.log(oldValue);
        console.log(newValue);
        if(oldValue != newValue) {
          var user = $scope.originalDataSource.users[userIndex];

          if (oldValue === undefined) {
            var entry = {
              assignmentId: assignmentIndex,
              value: parseInt(newValue,10)
            };
            addGrade(entry, user.id);
          } else {
            for (var i = 0, len = user.assignments.length; i < len; i++) {
              if (user.assignments[i].assignmentId === assignmentIndex) {
                var assignment =  user.assignments[i];
                assignment.value = parseInt(newValue,10);
                updateGrade(assignment, user.id);
                break;
              }
            }
          }

        }
      };

      var _assignmentArray = [];

      /***
       * PREPARE STUDENT FROM ORIGINAL DATASOURCE TO TRANSFORMED ONE
       * @param user
       * @return {{id: *, firstName: (*|.get.interceptor.responseError.firstName|.getBySection.interceptor.responseError.firstName), lastName: (*|.get.interceptor.responseError.lastName|.getBySection.interceptor.responseError.lastName), finalGrade: (*|.get.interceptor.responseError.finalGrade|.getBySection.interceptor.responseError.finalGrade)}}
       */
      var prepareSingleStudent = function (user) {
        var newUser = {
          id:user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          finalGrade: user.finalGrade
        };

        var userAssignments = user.assignments;

        for (var a = 0, aLen = _assignmentArray.length; a < aLen; a++) {
          var _assignmentId = _assignmentArray[a];

          for(var u = 0, uLen = userAssignments.length; u < uLen; u++) {
            if (userAssignments[u].assignmentId === _assignmentId) {
              newUser['assignment_' + _assignmentId] = userAssignments[u].value;
            }
          }
        }
        //console.log(newUser);
        return newUser;
      };

      /***
       * PREPARE ARRAY OF ASSIGNMENTS
       * To keep all assignments in order. Required for correct headers render
       * @param assignments
       */
      var prepareAssignmentArray = function (assignments) {
        _assignmentArray = [];
        var _columns = defaultColumns();

        for (var i = 0, len = assignments.length; i < len; i++) {
          _assignmentArray.push(assignments[i].id);

          _columns.push({
            data: 'assignment_' +  assignments[i].id,
            title: assignments[i].name
          })
        }

        _columns.push({
          title: 'Add new assignment',
          readOnly: true
        });

        $scope.columns = _columns;
      };

      var prepareAssignments = function (result) {
        $scope.originalDataSource = result;
        prepareAssignmentArray(result.assignments);

        for (var i = 0, len = result.users.length; i<len;i++) {
          $scope.users.push(prepareSingleStudent(result.users[i]));
        }
      };

      /***
       * GET SECTION
       * Get list of all students for section with assignments
       */
      var getSection = function () {
        console.log('getSection');
        classSectionFactory.getBySection({sectionId: $scope.sectionId}).$promise.then(
          function (result) {
            console.log(result);
            $scope.users = [];
            prepareAssignments(result);
          },
          function (error) {
            $log.error('singleSectionCtrl:getSection', error);
          }
        )
      };

      getSection();
    }
  ]
).controller(
  'adjustGradeSettingsCtrl',
  [
    '$scope',
    '$modalInstance',
    'assignments',
    function ($scope, $modalInstance,assignments) {

      $scope.assignments = assignments;
      console.log(assignments);

      $scope.ok = function () {
        $modalInstance.close();
      };

      $scope.cancel = function () {
        $modalInstance.dismiss();
      };
    }
  ]
).controller(
  'addNewAssignmentCtrl',
  [
    '$scope',
    'categoryFactory',
    '$modalInstance',
    function ($scope, categoryFactory, $modalInstance) {

      $scope.assignment = {};

      $scope.categories = [];

      var getCategories = function () {
        categoryFactory.get().$promise.then(
          function (result) {
            $scope.categories = result;
          },
          function (error) {

          }
        )
      };

      getCategories();

      $scope.ok = function () {
        console.log($scope.assignment);
        $modalInstance.close($scope.assignment);
      };

      $scope.cancel = function () {
        $modalInstance.dismiss();
      };
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
      return $resource(appConfig.apiUrl + '/assignments/:assignmentId/ ',
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
          //TEST IF IT WORKS
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

angular.module('gradeBookApp.templates', ['courses/courses.html', 'gradebook/gradebook.html', 'singleSection/_addNewAssignment.html', 'singleSection/_adjustGradeSettings.html', 'singleSection/singleSection.html']);

angular.module("courses/courses.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("courses/courses.html",
    "<div class=\"row\">\n" +
    "  <h2>Student grades</h2>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"row\">\n" +
    "  <h3>Please select teacher and year</h3>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"row field\">\n" +
    "  <label class=\"inline one column year-teacher\">Year</label>\n" +
    "  <div class=\"picker two columns\">\n" +
    "    <select ng-model=\"select.year\" ng-options=\"year as year for year in years\">\n" +
    "      <option value=\"\">Select year</option>\n" +
    "    </select>\n" +
    "  </div>\n" +
    "</div>\n" +
    "<div class=\"row field\">\n" +
    "  <label class=\"inline one column year-teacher\">Teacher</label>\n" +
    "\n" +
    "  <div class=\"picker two columns\">\n" +
    "    <select ng-model=\"select.teacher\" ng-options=\"teacher for teacher in teachers\">\n" +
    "      <option value=\"\">Select teacher</option>\n" +
    "    </select>\n" +
    "  </div>\n" +
    "\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"row\" ng-if=\"select.teacher && select.year\">\n" +
    "  <h3>select a class section to edit grades</h3>\n" +
    "  <table class=\"rounded\">\n" +
    "    <thead>\n" +
    "    <tr>\n" +
    "      <th>\n" +
    "        CLASSES\n" +
    "      </th>\n" +
    "      <th>\n" +
    "        SECTIONS\n" +
    "      </th>\n" +
    "    </tr>\n" +
    "    </thead>\n" +
    "    <tbody ng-repeat=\"course in courses\">\n" +
    "    <tr ng-repeat=\"section in course.sections\">\n" +
    "      <td rowspan=\"{{course.sections.length}}\" ng-if=\"$index == 0\">{{course.fullname}}</td>\n" +
    "      <td>\n" +
    "        <a ng-href=\"/gradebook/sections/{{section.id}}\">{{section.name}}</a>\n" +
    "      </td>\n" +
    "    </tr>\n" +
    "    </tbody>\n" +
    "  </table>\n" +
    "</div>\n" +
    "\n" +
    "");
}]);

angular.module("gradebook/gradebook.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("gradebook/gradebook.html",
    "<div id=\"gradebook\">\n" +
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
    "  <div class=\"col-xs-9 col-sm-6\">\n" +
    "    <h2>Math 101: Group A</h2>\n" +
    "\n" +
    "    <button class=\"btn btn-primary visible-xs\" data-ng-click=\"showSearch()\">Show search</button>\n" +
    "    <button class=\"btn btn-primary\" data-ng-click=\"toggleAssignments(false)\"><i class=\"fa fa-plus\"></i>&nbsp;Add Assignment(s)</button>\n" +
    "    <button class=\"btn btn-primary\" data-ng-click=\"toggleFilter()\"><i class=\"fa fa-filter\"></i>&nbsp;Filters</button>\n" +
    "    <button class=\"btn btn-primary\" data-ng-click=\"toggleSettings()\"><i class=\"fa fa-sliders\"></i>&nbsp;Settings</button>\n" +
    "    <button class=\"btn btn-primary\" data-ng-click=\"toggleAssignments(true)\">ReadOnly test</button>\n" +
    "    <span>Click on an assignment to view and edit details</span>\n" +
    "\n" +
    "    <div style=\"overflow: auto; padding-bottom: 20px;\">\n" +
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
    "\n" +
    "  <div class=\"col-xs-3 right-settings\"  data-ng-class=\"{'hidden':!assignmentVisible}\">\n" +
    "    <h2 data-ng-if=\"!readOnly\">\n" +
    "      <span data-ng-if=\"!multipleAssignments\">Add Assignment</span>\n" +
    "      <span data-ng-if=\"multipleAssignments\">Add Assignments</span>\n" +
    "    </h2>\n" +
    "    <h2 data-ng-if=\"readOnly\">View Assignment</h2>\n" +
    "    <form>\n" +
    "      <div class=\"form-group\">\n" +
    "        <div class=\"col-xs-12\">\n" +
    "          <div class=\"radio-inline\">\n" +
    "            <input type=\"radio\" id=\"singleAssignment\" data-ng-model=\"multipleAssignments\" data-ng-value=\"false\">\n" +
    "            <label for=\"singleAssignment\">Single</label>\n" +
    "          </div>\n" +
    "          <div class=\"radio-inline\">\n" +
    "            <input type=\"radio\" id=\"multipleAssignments\" data-ng-model=\"multipleAssignments\" data-ng-value=\"true\">\n" +
    "            <label for=\"multipleAssignments\">Multiple</label>\n" +
    "          </div>\n" +
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
    "        <input id=\"date\" class=\"form-control\" type=\"text\"  data-ng-if=\"!readOnly\" data-ng-model=\"newAssignment.date\">\n" +
    "        <p data-ng-if=\"readOnly\">1/1/15</p>\n" +
    "      </div>\n" +
    "      <div class=\"form-group\">\n" +
    "        <label for=\"maxPoints\">Max Points</label>\n" +
    "        <input id=\"maxPoints\" class=\"form-control\" type=\"text\" data-ng-if=\"!readOnly\" data-ng-model=\"newAssignment.points_possible\">\n" +
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
    "        <select id=\"markingPeriod\" class=\"form-control\" data-ng-if=\"!readOnly\" data-ng-model=\"newAssignment.marking_period\" data-ng-options=\"period.id as period.name for period in marketingPeriodSet\">\n" +
    "\n" +
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
    "\n" +
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
    "    </form>\n" +
    "\n" +
    "\n" +
    "\n" +
    "\n" +
    "  </div>\n" +
    "\n" +
    "  <div class=\"col-xs-3 right-settings\" data-ng-class=\"{'hidden':!settingsVisible}\">\n" +
    "    <h2>Settings</h2>\n" +
    "    <div class=\"form-group\">\n" +
    "      <label>Final Grades Position</label>\n" +
    "      <div class=\"col-xs-12\">\n" +
    "        <div class=\"radio-inline\">\n" +
    "          <input type=\"radio\" id=\"leftPosition\">\n" +
    "          <label for=\"leftPosition\">Left</label>\n" +
    "        </div>\n" +
    "        <div class=\"radio-inline\">\n" +
    "          <input type=\"radio\" id=\"rightPosition\">\n" +
    "          <label for=\"rightPosition\">Right</label>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"form-group\">\n" +
    "      <label>Assignment Listed</label>\n" +
    "      <div class=\"col-xs-12\">\n" +
    "        <div class=\"radio-inline\">\n" +
    "          <input type=\"radio\" id=\"oldestFirst\">\n" +
    "          <label for=\"oldestFirst\">Oldest First</label>\n" +
    "        </div>\n" +
    "        <div class=\"radio-inline\">\n" +
    "          <input type=\"radio\" id=\"newestFirst\">\n" +
    "          <label for=\"newestFirst\">Newest First</label>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"form-group\">\n" +
    "      <label>Always Show Right Sidebar on Large Screens</label>\n" +
    "      <div class=\"col-xs-12\">\n" +
    "        <div class=\"radio-inline\">\n" +
    "          <input type=\"radio\" id=\"rightSidebarNo\">\n" +
    "          <label for=\"rightSidebarNo\">No</label>\n" +
    "        </div>\n" +
    "        <div class=\"radio-inline\">\n" +
    "          <input type=\"radio\" id=\"rightSidebarYes\">\n" +
    "          <label for=\"rightSidebarYes\">Yes</label>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"form-group\">\n" +
    "      <label>Grade input method</label>\n" +
    "      <p>Schooldriver Gradebook <a data-ng-click=\"\">(change)</a></p>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"form-group\">\n" +
    "      <label>Display names</label>\n" +
    "      <p>First Last <a data-ng-click=\"\">(change)</a></p>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("singleSection/_addNewAssignment.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("singleSection/_addNewAssignment.html",
    "<div class=\"modal active\">\n" +
    "  <div class=\"content\">\n" +
    "    <div class=\"modal-header\">\n" +
    "      <h2 class=\"modal-title text-center\">Add new assignment</h2>\n" +
    "    </div>\n" +
    "    <div class=\"modal-body\">\n" +
    "      <form class=\"form-horizontal\">\n" +
    "        <div class=\"row field\">\n" +
    "          <label class=\"inline two columns year-teacher\">Name</label>\n" +
    "\n" +
    "          <div class=\"seven columns\">\n" +
    "            <input type=\"text\" style=\"width: 100%\" class=\"input\" ng-model=\"assignment.name\"\n" +
    "                   placeholder=\"enter assignment title name\">\n" +
    "          </div>\n" +
    "        </div>\n" +
    "        <div class=\"row field\">\n" +
    "          <label class=\"two columns inline year-teacher\">Weight</label>\n" +
    "\n" +
    "          <div class=\"seven columns\">\n" +
    "            <input type=\"text\"  style=\"width: 100%\" class=\"input\" ng-model=\"assignment.weight\"\n" +
    "                   placeholder=\"enter assignment weight as a percentage\">\n" +
    "          </div>\n" +
    "        </div>\n" +
    "        <div class=\"row\">\n" +
    "          <label class=\"two columns  inline year-teacher\">Category</label>\n" +
    "\n" +
    "          <div class=\"seven columns picker\">\n" +
    "            <select class=\"form-control\" ng-model=\"assignment.category\"\n" +
    "                    ng-options=\"category.id as category.name for category in categories\">\n" +
    "              <option value=\"\">Select category</option>\n" +
    "            </select>\n" +
    "          </div>\n" +
    "        </div>\n" +
    "      </form>\n" +
    "    </div>\n" +
    "    <div class=\"row\">\n" +
    "      <div class=\"ten columns centered text-center\">\n" +
    "        <div class=\"btn primary medium\">\n" +
    "          <a ng-click=\"ok()\">OK</a>\n" +
    "        </div>\n" +
    "        <div class=\"btn warning medium\">\n" +
    "          <a ng-click=\"cancel()\">Cancel</a>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "</div>\n" +
    "\n" +
    "<!--<div class=\"modal-header\">-->\n" +
    "  <!--<h3 class=\"modal-title text-center\">Add new assignment</h3>-->\n" +
    "<!--</div>-->\n" +
    "<!--<div class=\"modal-body\">-->\n" +
    "  <!--<form class=\"form-horizontal\">-->\n" +
    "    <!--<div class=\"form-group\">-->\n" +
    "      <!--<label class=\"col-sm-3 control-label\">Name</label>-->\n" +
    "      <!--<div class=\"col-sm-8\">-->\n" +
    "        <!--<input type=\"text\" class=\"form-control\" ng-model=\"assignment.name\" placeholder=\"enter assignment title name\">-->\n" +
    "      <!--</div>-->\n" +
    "    <!--</div>-->\n" +
    "    <!--<div class=\"form-group\">-->\n" +
    "      <!--<label class=\"col-sm-3 control-label\">Weight</label>-->\n" +
    "      <!--<div class=\"col-sm-8\">-->\n" +
    "        <!--<input type=\"text\" class=\"form-control\" ng-model=\"assignment.weight\" placeholder=\"enter assignment weight as a percentage\">-->\n" +
    "      <!--</div>-->\n" +
    "    <!--</div>-->\n" +
    "    <!--<div class=\"form-group\">-->\n" +
    "      <!--<label class=\"col-sm-3 control-label\">Category</label>-->\n" +
    "      <!--<div class=\"col-sm-8\">-->\n" +
    "        <!--<select class=\"form-control\" ng-model=\"assignment.category\" ng-options=\"category.id as category.name for category in categories\">-->\n" +
    "          <!--<option value=\"\">Select category</option>-->\n" +
    "        <!--</select>-->\n" +
    "      <!--</div>-->\n" +
    "    <!--</div>-->\n" +
    "  <!--</form>-->\n" +
    "<!--</div>-->\n" +
    "<!--<div class=\"modal-footer\">-->\n" +
    "  <!--<button class=\"btn btn-primary\" ng-click=\"ok()\">OK</button>-->\n" +
    "  <!--<button class=\"btn btn-warning\" ng-click=\"cancel()\">Cancel</button>-->\n" +
    "<!--</div>-->\n" +
    "");
}]);

angular.module("singleSection/_adjustGradeSettings.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("singleSection/_adjustGradeSettings.html",
    "<div class=\"modal active\">\n" +
    "  <div class=\"content\">\n" +
    "    <div class=\"modal-header\">\n" +
    "      <h2 class=\"modal-title text-center\">Adjust grade settings</h2>\n" +
    "    </div>\n" +
    "    <div class=\"modal-body\">\n" +
    "      <form class=\"form-horizontal\">\n" +
    "        <div class=\"row field\" ng-repeat=\"assignment in assignments\">\n" +
    "          <label class=\"inline three columns year-teacher\">{{assignment.name}}</label>\n" +
    "          <div class=\"three columns append\">\n" +
    "            <input type=\"text\" class=\"input text-right\" style=\"margin-top: -2px\" ng-model=\"assignment.weight\" placeholder=\"enter weight\">\n" +
    "            <span class=\"adjoined\" id=\"basic-addon2\">%</span>\n" +
    "          </div>\n" +
    "        </div>\n" +
    "      </form>\n" +
    "    </div>\n" +
    "    <div class=\"row\">\n" +
    "      <div class=\"ten columns centered text-center\">\n" +
    "        <div class=\"btn primary medium\">\n" +
    "          <a ng-click=\"ok()\">Save</a>\n" +
    "        </div>\n" +
    "        <div class=\"btn warning medium\">\n" +
    "          <a ng-click=\"cancel()\">Cancel</a>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("singleSection/singleSection.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("singleSection/singleSection.html",
    "<div class=\"\">\n" +
    "  <hot-table\n" +
    "    afterChange=\"afterChange\",\n" +
    "    afterGetColHeader=\"afterGetColHeader\",\n" +
    "    rowHeaders=\"true\"\n" +
    "    colHeaders=\"true\"\n" +
    "    datarows=\"users\"\n" +
    "    columns=\"columns\"\n" +
    "    fixedColumnsLeft=\"3\"\n" +
    "    minSpareRows=\"1\"\n" +
    "    minSpareCols=\"1\"\n" +
    "    >\n" +
    "  </hot-table>\n" +
    "</div>\n" +
    "\n" +
    "<div style=\"margin-top: 20px;\">\n" +
    "  <div class=\"btn primary medium\">\n" +
    "    <a ng-href=\"#/students/classSections\">View courses & sections</a>\n" +
    "  </div>\n" +
    "</div>\n" +
    "");
}]);
