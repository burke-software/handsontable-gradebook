angular.module('gradeBookApp.services')
  .factory(
  'schoolYearFactory',
  [
    'appConfig',
    '$resource',
    function (appConfig, $resource) {
      return $resource(appConfig.apiUrl + 'schoolYear/:schoolYearId/ ',
        {
          schoolYearId: '@schoolYearId'
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
