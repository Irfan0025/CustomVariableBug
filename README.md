# CustomVariableBug

We have a web app from which we can send out alerts and while creating such alerts we can add something called Custom Variables, let say I use this app to send Salary credited message to my employees so I will need a template of this message
to avoid creating a message everytime I can use that template in that I will add the standard details like company names and everything but the salary will differ from emp to emp so I'll add a custom variable there like {Salary} so that I can fill that out while sending out the alert.

The issue is when we delete the customer variable from the body it should allow me to just save not save as Template since it is not a template if there is no custom variables

So I'm trying to read the alertDetails property I can update that boloean value in the belwo "istemplate" place to get the desired outcome


Filename:CreateAlertTemplate

<CreateAlertSaveAsButton (this components has been called from the other file)
                                                    disabled={isSaveAlertDisabled}
                                                    isTemplate={containsVariables(alertDetails)}
                                                    onSave={handleSave}
                                                    onSaveAsDraft={handleSaveAsDraft}
                                                    onSaveAsTemplate={handleSaveAsTemplateOpen}
                                                />
                                            )}



Filename:CreateAlertSaveAsButton

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
