import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import {
    BoardIcon,
    DropdownButton,
    EmptyFileIcon,
    FloppyDiskIcon,
    FloppyDiskOutlinedIcon,
    Menu,
    MenuItem,
    MenuItemIcon,
    MenuItemText
} from 'apple-ui-components';

import { alertsTranslations, commonTranslations } from 'translations';
import { withFeatureFlags } from 'modules/Common';

const CreateAlertSaveAsButton = ({ disabled, isTemplate, getFeature, onSave, onSaveAsTemplate, onSaveAsDraft }) => {
    const [isToggled, setToggled] = useState(false);
    const handleToggle = useCallback(() => setToggled(!isToggled), [isToggled]);

    const handleMenuItemClick = useCallback((_, fn) => {
        setToggled(false);

        if (fn) {
            fn();
        }
    }, []);
    const isSaveAsDraftEnabled = getFeature('createAlertsPageSaveAsDraft');

    // const string = alertDetails.alertMessage.en_US.all.includes('placeholder');
    // console.log(string);

    return (
        <DropdownButton
            disabled={disabled}
            className="text-uppercase"
            title={
                <>
                    <FloppyDiskIcon className="mr-2" />
                    <FormattedMessage {...commonTranslations.ng_common_save} />
                </>
            }
            isOpen={isToggled}
            onToggle={handleToggle}
        >
            <Menu>
                {!isTemplate && (
                    <MenuItem value={onSave} onClick={handleMenuItemClick} aria-labelledby="save_menu_item">
                        <MenuItemIcon>
                            <FloppyDiskOutlinedIcon />
                        </MenuItemIcon>
                        <MenuItemText id="save_menu_item">
                            <FormattedMessage {...commonTranslations.ng_common_save} />
                        </MenuItemText>
                    </MenuItem>
                )}
                {isSaveAsDraftEnabled && (
                    <MenuItem
                        value={onSaveAsDraft}
                        onClick={handleMenuItemClick}
                        aria-labelledby="save_as_draft_menu_item"
                    >
                        <MenuItemIcon>
                            <EmptyFileIcon />
                        </MenuItemIcon>
                        <MenuItemText id="save_as_draft_menu_item">
                            <FormattedMessage {...alertsTranslations.ng_alerts_saveAsDraft} />
                        </MenuItemText>
                    </MenuItem>
                )}
                {isTemplate && (
                    <MenuItem
                        value={onSaveAsTemplate}
                        onClick={handleMenuItemClick}
                        aria-labelledby="save_as_template_menu_item"
                    >
                        <MenuItemIcon>
                            <BoardIcon />
                        </MenuItemIcon>
                        <MenuItemText id="save_as_template_menu_item">
                            <FormattedMessage {...alertsTranslations.ng_alerts_saveAsTemplate} />
                        </MenuItemText>
                    </MenuItem>
                )}
            </Menu>
        </DropdownButton>
    );
};

CreateAlertSaveAsButton.propTypes = {
    disabled: PropTypes.bool,
    getFeature: PropTypes.func,
    isTemplate: PropTypes.bool,
    onSave: PropTypes.func,
    onSaveAsDraft: PropTypes.func,
    onSaveAsTemplate: PropTypes.func
};

export default withFeatureFlags(CreateAlertSaveAsButton);
