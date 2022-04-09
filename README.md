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


The alertDetails.Variables is an Array that records CustomVariables but it records as soon as a custom variable is created but it should only record if a custom variable is inserted into the body and it should delete the entry as soon as we erase the custom variable off the body.


<img width="1238" alt="image" src="https://user-images.githubusercontent.com/95692861/162587892-fb145b66-4a9e-4317-8fa9-432e4b3b81da.png">

<img width="1238" alt="image" src="https://user-images.githubusercontent.com/95692861/162587918-f3843ad3-7047-45f6-81b2-5a332dfc7680.png">(Example of creating a custom variable)

<img width="1238" alt="image" src="https://user-images.githubusercontent.com/95692861/162587964-133e821b-7213-4fdc-9edf-97cb3c4b716b.png">(Example of an inserted custom variable)




