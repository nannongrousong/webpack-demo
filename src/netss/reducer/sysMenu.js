import { SET_SYS_MENU } from 'NETSS_ACTIONTYPE/sysMgr';

const initialState = [];

export default (state = initialState, action = {}) => {
    switch (action.type) {
        case SET_SYS_MENU:
            return action.menu;
        default:
            return state;
    }
};