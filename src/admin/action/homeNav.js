import { SET_NAV_MENU, SET_NAV_TAB, ACTIVE_TAB, CLOSE_NAV_TAB, CLOSE_NAV_OTHER_TAB, CLOSE_NAV_ALL_TAB, EDIT_TAB_STORE, RESET_TAB_STORE } from 'ADMIN_ACTIONTYPE/homeNav';
import { Load_User_Menus } from 'ADMIN_SERVICE/Authority_Mgr';
import { errorHandle } from 'COMMON_UTILS/common';

export const setNavTab = () => async (dispatch, getState) => {
    try {
        let resData = await Load_User_Menus();
        dispatch({
            type: SET_NAV_TAB,
            data: resData.data
        });
    } catch (err) {
        errorHandle(err);
    }
};

export const initNavMenu = (initPath, callBack) => async (dispatch, getState) => {
    try {
        let resData = await Load_User_Menus();
        dispatch({
            type: SET_NAV_MENU,
            data: resData.data
        });

        let { navMenu } = getState().homeNav;
        let routeInfo = null;

        if (initPath == '/index') {
            routeInfo = getFirstShowPage(navMenu) || _firstValidPath;
            _firstValidPath = null;
        } else {
            routeInfo = getRouteInfo(initPath, navMenu);
        }

        let activeRoute = routeInfo ? routeInfo.path : '/404';

        dispatch({
            type: ACTIVE_TAB,
            data: {
                activeRoute,
                navTab: routeInfo ? [routeInfo] : []
            }
        });

        typeof callBack == 'function' && callBack(activeRoute);
    } catch (err) {
        errorHandle(err);
    }
};

const getRouteInfo = (path, routes) => {
    for (let i = 0; i < routes.length; i++) {
        if (routes[i]['path'] == path) {
            return routes[i];
        }

        if (routes[i].children) {
            let tempRes = getRouteInfo(path, routes[i].children);
            if (tempRes) {
                return tempRes;
            }
        }
    }
};

//  找第一个显示的tab页，若没有设置，则取第一个有效的path
let _firstValidPath = null;
const getFirstShowPage = (routes) => {
    for (let i = 0; i < routes.length; i++) {
        if (!_firstValidPath && routes[i].path) {
            _firstValidPath = routes[i];
        }

        if (routes[i] && routes[i].defaultShow) {
            return routes[i];
        }

        if (routes[i].children) {
            let tempRes = getFirstShowPage(routes[i].children);
            if (tempRes && tempRes.defaultShow) {
                return tempRes;
            }
        }
    }
};

/**
 * 
 * @param {路由路径 path} fieldKey 
 * @param {回调函数，送出查询到的path供页面跳转} callBack 
 */
export const setActiveTab = (tabPath, callBack) => (dispatch, getState) => {
    let { navTab, navMenu } = getState().homeNav;
    let routeInfo = getRouteInfo(tabPath, navMenu);

    if (!routeInfo) {
        return;
    }

    let { path } = routeInfo;
    let resTab = navTab.find((tab) => tab.path == path);

    dispatch({
        type: ACTIVE_TAB,
        data: {
            activeRoute: path,
            navTab: !resTab ? [...navTab, routeInfo] : navTab
        }
    });

    typeof callBack == 'function' && callBack(path);
};

export const closeNavTab = (tabPath, callBack) => (dispatch, getState) => {
    let { navTab, activeRoute, storeMap } = getState().homeNav;
    let newPath = '';
    let tabIndex = navTab.findIndex((route) => route.path == tabPath);

    //  关闭的是当前激活的
    if (tabPath == activeRoute) {
        if (tabIndex == navTab.length - 1) {
            //  当前激活的是最后一个tab页，取相邻左边一个
            //  考虑仅剩下一个情况
            newPath = (navTab.length == 1) ? '' : navTab[tabIndex - 1].path;
        } else {
            //  当前激活的非最后一个tab页，取相邻右边一个
            newPath = navTab[tabIndex + 1].path;
        }
    } else {
        newPath = activeRoute;
    }

    dispatch({
        type: CLOSE_NAV_TAB,
        data: {
            activeRoute: newPath,
            navTab: [...navTab.slice(0, tabIndex), ...navTab.slice(tabIndex + 1, navTab.length)]
        }
    });

    resetTabStore([storeMap[tabPath].storeName], dispatch);

    typeof callBack == 'function' && callBack(newPath);
};

export const closeOtherNavTab = (tabPath) => (dispatch, getState) => {
    let { navMenu, navTab, storeMap } = getState().homeNav;
    let routeInfo = getRouteInfo(tabPath, navMenu);

    dispatch({
        type: CLOSE_NAV_OTHER_TAB,
        data: {
            activeRoute: tabPath,
            navTab: [routeInfo]
        }
    });

    let storeNames = [];
    navTab.forEach((tab) => {
        if (tab.path != tabPath) {
            storeNames.push(storeMap[tab.path].storeName);
        }
    });
    resetTabStore(storeNames, dispatch);
};

export const closeAllNavTab = () => (dispatch, getState) => {
    let { navTab, storeMap } = getState().homeNav;
    let storeNames = navTab.map((tab) => (storeMap[tab.path].storeName));

    dispatch({
        type: CLOSE_NAV_ALL_TAB,
        data: {
            activeRoute: '',
            navTab: []
        }
    });

    resetTabStore(storeNames, dispatch);
};

export const editTabStore = (path, storeName) => (dispatch, getState) => {
    const { storeMap } = getState().homeNav;
    if (!(storeMap[path] && !storeMap[path].firstIn)) {
        dispatch({
            type: EDIT_TAB_STORE,
            data: {
                storeMap: { ...storeMap, [path]: { storeName, firstIn: !storeMap[path] } }
            }
        });
    }
};

const resetTabStore = (storeNames, dispatch) => {
    dispatch({
        type: RESET_TAB_STORE,
        storeNames
    });
};