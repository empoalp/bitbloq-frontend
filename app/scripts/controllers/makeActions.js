'use strict';

/**
 * @ngdoc function
 * @name bitbloqApp.controller:MakeActionsCtrl
 * @description
 * # MakeActionsCtrl
 * Controller of the bitbloqApp
 */

angular.module('bitbloqApp')
    .controller('MakeActionsCtrl', function ($rootScope, $scope, $log, $location, $window, $document, alertsService, bloqs, ngDialog, projectApi,
        exerciseApi, _, $route, commonModals, clipboard, projectService, $translate, web2board) {


        $scope.defaultZoom = 1;
        $scope.modal = {
            projectCloneName: ''
        };
        $scope.projectApi = projectApi;
        $scope.commonModals = commonModals;

        $scope.currentProjectService = $scope.currentProjectService || projectService;

        $scope.currentProject = $scope.currentProject || $scope.currentProject;

        $scope.isEmptyProject = function () {
            return _.isEqual(projectService.project, projectService.getDefaultProject());
        };
        $scope.uploadProjectSelected = function (fileList) {

            // Only allow uploading one file.
            if (fileList.length > 1) {
                alertsService.add({
                    text: 'make-import-project-format-error',
                    id: 'error-import-project',
                    type: 'warning'
                });
                return false;
            }
            var file = fileList[0];

            var reader = new FileReader();

            reader.onloadend = function (event) {
                var target = event.target,
                    fileParsed;
                // 2 == FileReader.DONE
                if (target.readyState === 2) {

                    try {
                        fileParsed = JSON.parse(target.result);
                    } catch (e) {
                        alertsService.add({
                            text: 'make-import-project-format-error',
                            id: 'error-import-project',
                            type: 'warning'
                        });
                        return false;
                    }
                    if (!fileParsed.defaultTheme) {
                        fileParsed.defaultTheme = 'infotab_option_grayTheme';
                    }
                    if (fileParsed.id) {
                        fileParsed.id = '';
                    }
                    $scope.uploadFileProject(fileParsed);
                    $scope.$apply();
                    $scope.setCode($scope.getCode());
                    if (!$scope.common.user) {
                        $scope.common.session.save = true;
                        $scope.common.session.project = fileParsed;
                        //to avoid reload
                        $route.current.pathParams.id = undefined;
                        $location.url('/bloqsproject/');

                    }

                } else {
                    return false;
                }

                // Reset value of input after loading because Chrome will not fire
                // a 'change' event if the same file is loaded again.
                angular.element('#uploadProject')[0].value = '';
            };

            reader.readAsText(file);
        };

        $scope.openProject = function () {

            var dialog, modalScope = $rootScope.$new();
            _.extend(modalScope, {
                title: 'explore-open-project',
                contentTemplate: '/views/modals/openProject.html',
                modalButtons: true,
                selectedTab: 0,
                confirmButton: 'explore-open-project',
                rejectButton: 'cancel',
                selectedProject: {},
                confirmAction: function () {
                    dialog.close();
                    if (modalScope.selectedProject.project.codeProject) {
                        $window.open('#/codeproject/' + modalScope.selectedProject.project._id);
                    } else {
                        $window.open('#/bloqsproject/' + modalScope.selectedProject.project._id);
                    }
                },
                userProjectsOrderBy: 'updatedAt',
                userProjectsReverseOrder: true,
                orderOptions: ['explore-sortby-recent', 'explore-sortby-old', 'explore-sortby-name-az', 'explore-sortby-name-za'],
                userProjectsFilter: 'all',
                sortProjects: sortProjects(modalScope)
            });

            projectApi.getAllMyProjects().then(function (projects) {
                modalScope.projects = projects;
            }, function () {
                alertsService.add({
                    text: 'make-get-project-error',
                    id: 'make-get-project-error',
                    type: 'warning'
                });
            });

            projectApi.getMySharedProjects().then(function (sharedProjects) {
                modalScope.sharedProjects = sharedProjects;
            }, function () {
                alertsService.add({
                    text: 'make-get-shared-project-error',
                    id: 'make-get-shared-project-error',
                    type: 'warning'
                });
            });

            dialog = ngDialog.open({
                template: '/views/modals/modal.html',
                className: 'modal--container modal--open-project',
                scope: modalScope
            });
        };

        $scope.openFileProject = function () {
            $('#uploadProject').trigger('click');
        };

        $scope.downloadIno = function () {
            var code = $scope.common.section !== 'codeproject' ? $scope.getCode() : $scope.currentProject.code;
            $scope.currentProject.code = code;
            $scope.currentProjectService.download($scope.currentProject, 'arduino');
        };

        $scope.removeProject = function (project, type) {
            switch (type) {
                case 'exercise':
                    var currentModal,
                        parent = $rootScope,
                        modalOptions = parent.$new();
                    _.extend(modalOptions, {
                        title: $scope.common.translate('deleteExercise_modal_title') + ': ' + project.name,
                        confirmButton: 'button_delete',
                        confirmAction: function () {
                            exerciseApi.delete(project._id).then(function () {
                                $log.log('we delete this project');
                            }, function (error) {
                                $log.log('Delete error: ', error);
                                alertsService.add({
                                    text: 'make-delete-project-error',
                                    id: 'deleted-project',
                                    type: 'warning'
                                });
                            });
                            currentModal.close();
                            $location.path('exercises');
                        },
                        rejectButton: 'modal-button-cancel',
                        contentTemplate: '/views/modals/information.html',
                        textContent: $scope.common.translate('deleteExercise_modal_information'),
                        secondaryContent: 'deleteExercise_modal_information-explain',
                        modalButtons: true
                    });

                    currentModal = ngDialog.open({
                        template: '/views/modals/modal.html',
                        className: 'modal--container modal--input',
                        scope: modalOptions
                    });

                    break;
                case 'task':
                    exerciseApi.deleteTask(project._id).then(function () {
                        $log.log('we delete this project');
                    }, function (error) {
                        $log.log('Delete error: ', error);
                        alertsService.add({
                            text: 'make-delete-project-error',
                            id: 'deleted-project',
                            type: 'warning'
                        });
                    });
                    $location.path('classes');
                    break;
                default:
                    if (project._id) {
                        projectApi.delete(project._id).then(function () {
                            alertsService.add({
                                text: 'projects_toast_send-to-trash',
                                id: 'deleted-project',
                                type: 'info',
                                time: 7000
                            });
                        }, function (error) {
                            $log.log('Delete error: ', error);
                            alertsService.add({
                                text: 'make-delete-project-error',
                                id: 'deleted-project',
                                type: 'warning'
                            });
                        });
                        $location.path('projects/myprojects');
                    } else {
                        alertsService.add({
                            text: 'make-delete-project-not-changed',
                            id: 'deleted-project',
                            type: 'ok',
                            time: 5000
                        });
                    }
            }
        };

        $scope.copycode = function () {
            alertsService.add({
                text: 'make-code-clipboard',
                id: 'code-clipboard',
                type: 'info',
                time: 3000
            });
            clipboard.copyText($scope.getCode());
        };

        $scope.dropdownHandler = function (menu) {
            if ($scope.dropdown !== menu) {
                $scope.dropdown = menu;
            } else {
                $scope.dropdown = false;
            }
        };

        $scope.zoom = function (value) {
            var max = 2,
                min = 0.7,
                fieldContent = $('.bloq--extension__content'),
                zoom;

            if (value !== 1) {
                zoom = $scope.defaultZoom + value;
            } else {
                zoom = 1;
            }

            if (zoom > max || zoom < min) {
                return false;
            } else {
                fieldContent.css('zoom', zoom);
                $scope.defaultZoom = zoom;
            }
        };

        $scope.editExerciseGroups = function (exercise, groups, onlyEdit) {
            $scope.currentProjectService.assignGroup(exercise, $scope.common.user._id, groups, null, onlyEdit).then(function (response) {
                $scope.setGroups(response);
            });
        };

        $scope.isThirdPartyRobot = function () {
            return $scope.currentProject.hardware.showRobotImage ? true : false;
        };

        $rootScope.$on('viewer-code:ready', function () {
            if (show) {
                var componentsJSON = $scope.getComponents($scope.currentProject.hardware.components);
                if ($scope.currentProject.hardware.board) {
                    if ($scope.common.useChromeExtension()) {
                        $scope.commonModals.launchViewerWindow($scope.currentProjectService.getBoardMetaData(), componentsJSON);
                    }
                } else {
                    $scope.currentTab = 0;
                    $scope.levelOne = 'boards';
                    $scope.alertsService.add({
                        text: 'alert-web2board-no-board-serial',
                        id: 'serialmonitor',
                        type: 'warning',
                        link: function () {
                            var tempA = document.createElement('a');
                            tempA.setAttribute('href', '#/support/p/noBoard');
                            tempA.setAttribute('target', '_blank');
                            document.body.appendChild(tempA);
                            tempA.click();
                            document.body.removeChild(tempA);
                        },
                        linkText: $translate.instant('support-go-to')
                    });
                }
                show = false;
            }
        });

        var availableViewerSensors = [
            'encoder',
            'hts221',
            'pot',
            'ldrs',
            'sound',
            'us',
            'irs',
            'button'
        ];

        function _existViewerBlock(code) {
            var serialBlock;
            if (code.indexOf('/*sendViewerData*/') > -1) {
                serialBlock = true;
            } else {
                serialBlock = false;
            }

            return serialBlock;
        }

        function _getComponents(componentsArray) {
            var components = {};

            var serialPort = _.find(componentsArray, function (o) {
                return o.uuid === 'sp';
            });

            var bluetooth = _.find(componentsArray, function (o) {
                return o.uuid === 'bt';
            });

            var phoneElements = _.find(componentsArray, function (o) {
                return o.uuid === 'device';
            });
            if (serialPort) {
                components.sp = serialPort.name;
            }

            if (bluetooth) {
                components.bt = bluetooth.name;
            }

            if (phoneElements) {
                components.device = phoneElements.name;
            }

            _.forEach(componentsArray, function (value) {
                if (availableViewerSensors.indexOf(value.uuid) !== -1) {
                    if (components[value.uuid]) {
                        components[value.uuid].names.push(value.name);
                    } else {
                        components[value.uuid] = {};
                        components[value.uuid].type = value.type;
                        components[value.uuid].names = [value.name];
                    }
                }
            });
            return components;
        };

        function _generateSensorsCode(components, serialName, code) {
            _.forEach(components, function (value, key) {
                if (angular.isObject(value)) {
                    if (value.type === 'analog') {
                        _.forEach(value.names, function (name) {
                            code = code.concat(serialName + '.println(String("[' + key.toUpperCase() + ':' + name + ']:") + String(String(analogRead(' + name + '))));\n\r');
                            //  code = code + 'delay(500);\n\r';
                        });
                    } else {
                        _.forEach(value.names, function (name) {
                            if (key === 'us' || key === 'encoder') {
                                code = code.concat(serialName + '.println(String("[' + key.toUpperCase() + ':' + name + ']:") + String(String(' + name + '.read())));\n\r');
                                code = code + 'delay(50);\n\r';
                            } else if (key === 'hts221') {
                                code = code.concat(serialName + '.println(String("[' + key.toUpperCase() + '_temperature:' + name + ']:") + String(String(' + name + '.getTemperature())));\n\r');
                                code = code + 'delay(50);\n\r';
                                code = code.concat(serialName + '.println(String("[' + key.toUpperCase() + '_humidity:' + name + ']:") + String(String(' + name + '.getHumidity())));\n\r');
                                code = code + 'delay(50);\n\r';
                            } else {
                                code = code.concat(serialName + '.println(String("[' + key.toUpperCase() + ':' + name + ']:") + String(String(digitalRead(' + name + '))));\n\r');
                                //   code = code + 'delay(500);\n\r';
                            }
                        });
                    }
                }
            });

            return code;
        }

        function _getViewerCode(componentsArray, originalCode) {
            var components = _getComponents(componentsArray);
            var code = originalCode;
            var serialName;
            var visorCode;
            if (components.sp) {
                serialName = components.sp;
                visorCode = _generateSensorsCode(components, serialName, '');
                code = code.replace(/loop\(\){([^]*)}/, 'loop() {' + visorCode + '$1' + '}');
            } else {
                var serialCode = originalCode.split('/***   Included libraries  ***/');
                serialCode[1] = '\n\r#include <SoftwareSerial.h>\n\r#include <BitbloqSoftwareSerial.h>' + serialCode[1];
                code = '/***   Included libraries  ***/' + serialCode[0] + serialCode[1];
                code = code.split('\n/***   Setup  ***/');
                code = code[0].substring(0, code[0].length - 1) + 'bqSoftwareSerial puerto_serie_0(0, 1, 9600);' + '\n\r' + '\n/***   Setup  ***/' + code[1];
                visorCode = _generateSensorsCode(components, 'puerto_serie_0', '');
                code = code.replace(/loop\(\){([^]*)}/, 'loop() {' + visorCode + '$1' + '}');
            }
            return code;
        }


        var show;
        $scope.showViewer = function () {
            alertsService.add({
                text: 'alert-viewer-reconfigure',
                id: 'upload',
                type: 'loading'
            });
            var code = $scope.currentProjectService.getCode();
            if (!_existViewerBlock(code)) {
                code = _getViewerCode($scope.currentProject.hardware.components, $scope.currentProjectService.getCode());
            }
            web2board.upload({
                board: $scope.currentProjectService.getBoardMetaData(),
                code: code,
            }).then(function (response) {
                console.log('upload ok, show window', response);
                $scope.commonModals.launchViewerWindow($scope.currentProjectService.project, _getComponents($scope.currentProject.hardware.components));
            }, function (error) {
                console.log('upload error', error);
                if (error.error === 'no-board') {
                    $scope.setTab(0);
                    $scope.levelOne = 'boards';
                }
            });
            /*if ($scope.common.useChromeExtension()) {
                $scope.currentProjectService.startAutosave(true);
                show = true;
                if (!$scope.currentProject.codeproject) {
                    //parent: bloqsproject
                    if ($scope.thereIsSerialBlock($scope.currentProjectService.getCode())) {
                        $scope.upload();
                    } else {
                        var viewerCode = $scope.getViewerCode($scope.currentProject.hardware.components, $scope.currentProjectService.getCode());
                        $scope.upload(viewerCode);
                    }
                } else {
                    //parent: codeproject
                }
            } else {
                commonModals.requestChromeExtensionActivation('modal-need-chrome-extension-activation-viewer', function (err) {
                    if (!err) {
                        $scope.currentProjectService.startAutosave(true);
                        show = true;
                        if (!$scope.currentProject.codeproject) {
                            //parent: bloqsproject
                            if ($scope.thereIsSerialBlock($scope.currentProjectService.getCode())) {
                                $scope.upload();
                            } else {
                                var viewerCode = $scope.getViewerCode($scope.currentProject.hardware.components, $scope.currentProjectService.getCode());
                                $scope.upload(viewerCode);
                            }
                        } else {
                            //parent: codeproject
                        }
                    }
                });
            }*/

        };

        function sortProjects(modalScope) {
            return function (type) {
                $log.debug('sortProject', type);
                switch (type) {
                    case 'explore-sortby-recent':
                        modalScope.userProjectsOrderBy = 'updatedAt';
                        modalScope.userProjectsReverseOrder = true;
                        break;
                    case 'explore-sortby-old':
                        modalScope.userProjectsOrderBy = 'updatedAt';
                        modalScope.userProjectsReverseOrder = false;
                        break;
                    case 'explore-sortby-name-az':
                        modalScope.userProjectsOrderBy = 'name';
                        modalScope.userProjectsReverseOrder = false;
                        break;
                    case 'explore-sortby-name-za':
                        modalScope.userProjectsOrderBy = 'name';
                        modalScope.userProjectsReverseOrder = true;
                        break;
                }
            };
        }

        function clickDocumentHandler(evt) {
            if (!$(evt.target).hasClass('actions__menu--selected')) {
                $scope.dropdownHandler(false);
                if (!$scope.$$phase) {
                    $scope.$digest();
                }
            }
        }

        $document.on('click', clickDocumentHandler);

        $scope.$on('$destroy', function () {
            $document.off('click', clickDocumentHandler);
        });

    });
