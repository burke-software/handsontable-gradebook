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
          delete: {
            method: 'DELETE',
            interceptor: {
              responseError: function (error) {
                $log.error('DELETE SINGLE ASSIGNMENT:', error);

              }
            }
          },

          create: {
            method: 'POST',
            interceptor: {
              responseError: function (error) {
                $log.error('CREATE SINGLE ASSIGNMENT:', error);

                return {
                  id: 4,
                  name: 'Test',
                  weight:13,
                  category:3
                }
              }
            }
          },
          update: {
            method: 'PUT',
            interceptor: {
              responseError: function (error) {
                $log.error('UPDATE SINGLE ASSIGNMENT:', error);
              }
            }
          }
        }
      )
    }
  ]
);
