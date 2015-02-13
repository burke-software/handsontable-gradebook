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
