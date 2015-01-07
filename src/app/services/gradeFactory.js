/**
 * Created by jkl on 05.01.15.
 */
angular.module('gradeBookApp.services')
  .factory(
  'gradeFactory',
  [
    'appConfig',
    '$resource',
    '$log',
    function (appConfig, $resource, $log) {
      return $resource(appConfig.apiUrl + '/grade/:gradeId/ ',
        {
          gradeId: '@gradeId'
        },
        {
          create: {
            method: 'POST',
            interceptor: {
              responseError: function (error) {
                $log.error('ADD NEW GRADE:', error)
                return {

                }
              }
            }
          },

          update: {
            method: 'PUT',
            interceptor: {
              responseError: function (error) {
                $log.error('UPDATE EXISTING GRADE:', error);
              }
            }
          }
        }
      )
    }
  ]
);
