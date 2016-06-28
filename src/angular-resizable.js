angular.module('angularResizable', [])
    .directive('resizable', function() {
        var toCall;

        function throttle(fun) {
            if (toCall === undefined) {
                toCall = fun;
                setTimeout(function() {
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
                rDisabled: '=',
                rNoThrottle: '=',
                rParent: '=',
                rGrid: "=",
                rLimitResizeTo: '=?'
            },
            link: function(scope, elem, attr) {
                var element = elem;
                if (scope.rParent) {
                    element = elem.parent();
                }

                var flexBasis = 'flexBasis' in document.documentElement.style ? 'flexBasis' :
                    'webkitFlexBasis' in document.documentElement.style ? 'webkitFlexBasis' :
                    'msFlexPreferredSize' in document.documentElement.style ? 'msFlexPreferredSize' : 'flexBasis';

                // register watchers on width and height attributes if they are set
                scope.$watch('rWidth', function(value) {
                    element[0].style[scope.rFlex ? flexBasis : 'width'] = scope.rWidth + 'px';
                });
                scope.$watch('rHeight', function(value) {
                    element[0].style[scope.rFlex ? flexBasis : 'height'] = scope.rHeight + 'px';
                });
                scope.$watch('rGrid');

                element.addClass('resizable');

                var style = window.getComputedStyle(element[0], null),
                    originalW,
                    originalH,
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

                var updateInfo = function(e) {
                    info.width = false;
                    info.height = false;
                    if (axis === 'x')

                        info.width = parseInt(element[0].style[scope.rFlex ? flexBasis : 'width']);
                    else
                        info.height = parseInt(element[0].style[scope.rFlex ? flexBasis : 'height']);
                    info.id = element[0].id;
                    info.evt = e;
                    info.originalWidth = originalW;
                    info.originalHeight = originalH;
                };

                var getClientX = function(e) {
                    return e.touches ? e.touches[0].clientX : e.clientX;
                };

                var getClientY = function(e) {
                    return e.touches ? e.touches[0].clientY : e.clientY;
                };

                var dragging = function(e) {
                    var prop, offset = axis === 'x' ? start - getClientX(e) : start - getClientY(e);

                    var gridX = scope.rGrid ? scope.rGrid[0] : 1,
                        gridY = scope.rGrid ? scope.rGrid[1] : 1,
                        limitResizeTo = scope.rLimitResizeTo,
                        futureDimension;

                    offset = (axis == 'x') ? Math.round(offset / gridX) * gridX : Math.round(offset / gridY) * gridY;

                    switch (dragDir) {
                        case 'top':
                            futureDimension = h + (offset * vy);
                            if (angular.isDefined(limitResizeTo) && futureDimension > originalH + (gridY * limitResizeTo)) {
                                return;
                            }

                            prop = scope.rFlex ? flexBasis : 'height';
                            element[0].style[prop] = h + (offset * vy) + 'px';
                            break;
                        case 'bottom':
                            futureDimension = h - (offset * vy);
                            if (angular.isDefined(limitResizeTo) && futureDimension < originalH - (gridY * limitResizeTo)) {
                                return;
                            }

                            prop = scope.rFlex ? flexBasis : 'height';
                            element[0].style[prop] = h - (offset * vy) + 'px';
                            break;
                        case 'right':
                            futureDimension = w - (offset * vx);
                            if (angular.isDefined(limitResizeTo) && futureDimension > originalW + (gridX * limitResizeTo)) {
                                return;
                            }

                            prop = scope.rFlex ? flexBasis : 'width';
                            element[0].style[prop] = futureDimension + 'px';
                            break;
                        case 'left':
                            futureDimension = w + (offset * vx);
                            if (angular.isDefined(limitResizeTo) && futureDimension < originalW - (gridX * limitResizeTo)) {
                                return;
                            }

                            prop = scope.rFlex ? flexBasis : 'width';
                            element[0].style[prop] = w + (offset * vx) + 'px';
                            break;
                    }

                    updateInfo(e);

                    function resizingEmit() {
                        scope.$emit('angular-resizable.resizing', info);
                    }
                    if (scope.rNoThrottle) {
                        resizingEmit();
                    } else {
                        throttle(resizingEmit);
                    }
                };
                var dragEnd = function(e) {
                    updateInfo();

                    scope.$emit('angular-resizable.resizeEnd', info);
                    scope.$apply();
                    document.removeEventListener('mouseup', dragEnd, false);
                    document.removeEventListener('mousemove', dragging, false);
                    document.removeEventListener('touchend', dragEnd, false);
                    document.removeEventListener('touchmove', dragging, false);
                    element.removeClass('no-transition');
                };
                var dragStart = function(e, direction) {
                    dragDir = direction;
                    axis = dragDir === 'left' || dragDir === 'right' ? 'x' : 'y';
                    start = axis === 'x' ? getClientX(e) : getClientY(e);
                    var elRect = element[0].getBoundingClientRect();
                    w = parseInt(elRect.width);
                    h = parseInt(elRect.height);
                    originalW = w;
                    originalH = h;

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

                scope.$watch('rDisabled', function(disabled) {
                    dir.forEach(function(direction) {
                        if (disabled) {
                            return;
                        }

                        var grabber = document.createElement('div');

                        // add class for styling purposes
                        grabber.setAttribute('class', 'rg-' + direction);
                        grabber.innerHTML = inner;
                        element[0].appendChild(grabber);
                        grabber.ondragstart = function() {
                            return false;
                        };

                        var down = function(e) {
                            if (e.which === 1 || e.touches) {
                                // left mouse click or touch screen
                                dragStart(e, direction);
                            }
                        };
                        grabber.addEventListener('mousedown', down, false);
                        grabber.addEventListener('touchstart', down, false);
                    });
                });
            }
        };
    });