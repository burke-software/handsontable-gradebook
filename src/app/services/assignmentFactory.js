angular.module('gradeBookApp.services')
  .factory(
  'assignmentFactory',
  [
    'appConfig',
    '$resource',
    '$log',
    function (appConfig, $resource, $log) {
      return $resource(appConfig.apiUrl + '/assignment/:assignmentId/ ',
        {
          assignmentId: '@assignmentId'
        },
        {
          update: {
            method: 'PUT',
            interceptor: {
              responseError: function (error) {
                $log.error('PUT ERROR:', error);
              }
            }
          }
        }
      )
    }
  ]
);
