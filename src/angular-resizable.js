(function () {
    'use strict';

    angular.module('angularResizable', [])
        .directive('resizable', resizable);

    function resizable () {
        var toCall;

        function throttle (fun) {
            if (toCall === undefined) {
                toCall = fun;
                setTimeout(function () {
                    toCall();
                    toCall = undefined;
                }, 100);
            } else {
                toCall = fun;
            }
        }

        return {
            restrict: 'AE',
            scope: {
                rDirections: '=',
                rCenteredX: '=',
                rCenteredY: '=',
                rWidth: '=',
                rHeight: '=',
                rFlex: '=',
                rGrabber: '@',
                rDisabled: '@',
                rNoThrottle: '=',
                rMinWidth: '=',
                rMinHeight: '=',
                rMaxWidth: '=',
                rMaxHeight: '='
            },
            link: function (scope, element, attr) {
                var flexBasis = 'flexBasis' in document.documentElement.style ? 'flexBasis' :
                    'webkitFlexBasis' in document.documentElement.style ? 'webkitFlexBasis' :
                    'msFlexPreferredSize' in document.documentElement.style ? 'msFlexPreferredSize' : 'flexBasis';

                // register watchers on width and height attributes if they are set
                scope.$watch('rWidth', function (value) {
                    element[0].style[scope.rFlex ? flexBasis : 'width'] = scope.rWidth + 'px';
                });
                scope.$watch('rHeight', function (value) {
                    element[0].style[scope.rFlex ? flexBasis : 'height'] = scope.rHeight + 'px';
                });

                element.addClass('resizable');

                var style = window.getComputedStyle(element[0], null),
                    w,
                    h,
                    dir = scope.rDirections || ['right'],
                    vx = scope.rCenteredX ? 2 : 1, // if centered double velocity
                    vy = scope.rCenteredY ? 2 : 1, // if centered double velocity
                    inner = scope.rGrabber ? scope.rGrabber : '<span></span>',
                    start,
                    dragDir,
                    axis,
                    info = {};

                var updateInfo = function (e) {
                    info.width = false;
                    info.height = false;
                    if (axis === 'x')
                        info.width = parseInt(element[0].style[scope.rFlex ? flexBasis : 'width']);
                    else
                        info.height = parseInt(element[0].style[scope.rFlex ? flexBasis : 'height']);
                    info.id = element[0].id;
                    info.evt = e;
                };

                var getClientX = function (e) {
                    return e.touches ? e.touches[0].clientX : e.clientX;
                };

                var getClientY = function (e) {
                    return e.touches ? e.touches[0].clientY : e.clientY;
                };

                var dragging = function (e) {
                    var prop, newHeight, newWidth, offset = axis === 'x' ? start - getClientX(e) : start - getClientY(e);
                    switch (dragDir) {
                        case 'top':
                            newHeight = h + (offset * vy);
                            prop = scope.rFlex ? flexBasis : 'height';
                            element[0].style[prop] = (scope.rMaxHeight && scope.rMaxHeight < newHeight) ? scope.rMaxHeight : newHeight + 'px';
                            break;
                        case 'bottom':
                            newHeight = h - (offset * vy);
                            prop = scope.rFlex ? flexBasis : 'height';
                            element[0].style[prop] = (scope.rMinHeight && scope.rMinHeight > newHeight) ? scope.rMinHeight : newHeight + 'px';
                            break;
                        case 'right':
                            newWidth = w - (offset * vx);
                            prop = scope.rFlex ? flexBasis : 'width';
                            element[0].style[prop] = (scope.rMaxWidth && scope.rMaxWidth < newHeight) ? scope.rMaxWidth : newWidth + 'px';
                            break;
                        case 'left':
                            newWidth = w + (offset * vx);
                            prop = scope.rFlex ? flexBasis : 'width';
                            element[0].style[prop] = (scope.rMinWidth && scope.rMinWidth > newHeight) ? scope.rMinWidth : newWidth + 'px';
                            break;
                    }
                    updateInfo(e);

                    function resizingEmit () {
                        scope.$emit('angular-resizable.resizing', info);
                    }

                    if (scope.rNoThrottle) {
                        resizingEmit();
                    } else {
                        throttle(resizingEmit);
                    }
                };

                var dragEnd = function (e) {
                    updateInfo();
                    scope.$emit('angular-resizable.resizeEnd', info);
                    scope.$apply();
                    document.removeEventListener('mouseup', dragEnd, false);
                    document.removeEventListener('mousemove', dragging, false);
                    document.removeEventListener('touchend', dragEnd, false);
                    document.removeEventListener('touchmove', dragging, false);
                    element.removeClass('no-transition');
                };

                var dragStart = function (e, direction) {
                    dragDir = direction;
                    axis = dragDir === 'left' || dragDir === 'right' ? 'x' : 'y';
                    start = axis === 'x' ? getClientX(e) : getClientY(e);
                    w = parseInt(style.getPropertyValue('width'));
                    h = parseInt(style.getPropertyValue('height'));

                    //prevent transition while dragging
                    element.addClass('no-transition');

                    document.addEventListener('mouseup', dragEnd, false);
                    document.addEventListener('mousemove', dragging, false);
                    document.addEventListener('touchend', dragEnd, false);
                    document.addEventListener('touchmove', dragging, false);

                    // Disable highlighting while dragging
                    if (e.stopPropagation) e.stopPropagation();
                    if (e.preventDefault) e.preventDefault();
                    e.cancelBubble = true;
                    e.returnValue = false;

                    updateInfo(e);
                    scope.$emit('angular-resizable.resizeStart', info);
                    scope.$apply();
                };

                dir.forEach(function (direction) {
                    var grabber = document.createElement('div');

                    // add class for styling purposes
                    grabber.setAttribute('class', 'rg-' + direction);
                    grabber.innerHTML = inner;
                    element[0].appendChild(grabber);
                    grabber.ondragstart = function () {
                        return false;
                    };

                    var down = function (e) {
                        var disabled = (scope.rDisabled === 'true');
                        if (!disabled && (e.which === 1 || e.touches)) {
                            // left mouse click or touch screen
                            dragStart(e, direction);
                        }
                    };
                    grabber.addEventListener('mousedown', down, false);
                    grabber.addEventListener('touchstart', down, false);
                });
            }
        };
    }
})();
