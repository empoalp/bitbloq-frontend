'use strict';
angular
    .module('bitbloqApp')
    .service('centerModeApi', function($http, envData) {

        var centerModeApi = {
            addTeachers: addTeachers,
            createCenter: createCenter,
            createGroup: createGroup,
            deleteGroup: deleteGroup,
            deleteTeacher: deleteTeacher,
            getExercises: getExercises,
            getExercisesCount: getExercisesCount,
            getGroup: getGroup,
            getGroups: getGroups,
            getMyCenter: getMyCenter,
            getMyRole: getMyRole,
            getTasks: getTasks,
            getTeacher: getTeacher,
            getTeachers: getTeachers,
            isHeadMaster: isHeadMaster,
            registerInGroup: registerInGroup,
            updateGroup: updateGroup
        };

        function addTeachers(teachers, centerId) {
            return $http({
                method: 'POST',
                url: envData.config.centerModeUrl + 'center/' + centerId + '/teacher',
                data: teachers
            });
        }

        function createCenter(center) {
            return $http({
                method: 'POST',
                url: envData.config.centerModeUrl + 'center',
                data: center
            });
        }

        function createGroup(name, accessId, teacherId, centerId) {
            return $http({
                method: 'POST',
                url: envData.config.centerModeUrl + 'group',
                data: {
                    name: name,
                    statusId: 'open',
                    accessId: accessId,
                    teacher: teacherId,
                    center: centerId,
                    student: []
                }
            });
        }

        function deleteGroup(groupId) {
            return $http({
                method: 'DELETE',
                url: envData.config.centerModeUrl + 'group/' + groupId
            });
        }

        function deleteTeacher(teacherId, centerId) {
            return $http({
                method: 'DELETE',
                url: envData.config.centerModeUrl + 'center/' + centerId + '/teacher/' + teacherId
            });
        }

        function getExercises(teacherId, params) {
            if (teacherId) {
                return $http({
                    method: 'GET',
                    url: envData.config.centerModeUrl + 'exercise/teacher/' + teacherId,
                    params: params
                });
            } else {
                return $http({
                    method: 'GET',
                    url: envData.config.centerModeUrl + 'exercise',
                    params: params
                });
            }
        }

        function getExercisesCount(teacherId, params) {
            if (teacherId) {
                return $http({
                    method: 'GET',
                    url: envData.config.centerModeUrl + 'exercise/teacher/' + teacherId + '/count'
                });
            } else {
                return $http({
                    method: 'GET',
                    url: envData.config.centerModeUrl + 'exercise/count',
                    params: params
                });
            }
        }

        function getGroup(groupId) {
            return $http({
                method: 'GET',
                url: envData.config.centerModeUrl + 'group/' + groupId
            });
        }

        function getGroups(teacherId, centerId) {
            if (teacherId) {
                return $http({
                    method: 'GET',
                    url: envData.config.centerModeUrl + 'group/teacher/' + teacherId
                });
            } else if (centerId) {
                return $http({
                    method: 'GET',
                    url: envData.config.centerModeUrl + 'group/center/' + centerId
                });
            } else {
                return $http({
                    method: 'GET',
                    url: envData.config.centerModeUrl + 'group/'
                });
            }
        }

        function getMyCenter() {
            return $http({
                method: 'GET',
                url: envData.config.centerModeUrl + 'center/me'
            });
        }

        function getMyRole() {
            return $http({
                method: 'GET',
                url: envData.config.centerModeUrl + 'user/role'
            });
        }

        function getTasks() {
            return $http({
                method: 'GET',
                url: envData.config.centerModeUrl + 'task'
            });
        }

        function getTeacher(teacherId, centerId) {
            return $http({
                method: 'GET',
                url: envData.config.centerModeUrl + 'center/' + centerId + '/teacher/' + teacherId
            });
        }

        function getTeachers(centerId) {
            return $http({
                method: 'GET',
                url: envData.config.centerModeUrl + 'center/' + centerId + '/teacher'
            });
        }

        function isHeadMaster() {
            return $http({
                method: 'HEAD',
                url: envData.config.centerModeUrl + 'user/headMaster'
            });
        }

        function registerInGroup(groupId) {
            return $http({
                method: 'HEAD',
                url: envData.config.centerModeUrl + 'group/' + groupId + '/register'
            });
        }

        function updateGroup(group) {
            return $http({
                method: 'PUT',
                url: envData.config.centerModeUrl + 'group/' + group._id,
                data: group
            });
        }

        return centerModeApi;
    });
