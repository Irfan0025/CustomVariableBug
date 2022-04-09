/* eslint-disable react-hooks/exhaustive-deps */

import React, { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Redirect } from 'react-router';
import { FormattedMessage, useIntl } from 'react-intl';
import { useLocation } from 'react-router-dom';
import {
    Button,
    DomUtils,
    MessageIcon,
    Page,
    PageHeader,
    PaperFooter,
    PaperPlaneIcon,
    SettingsIcon,
    ToastrProvider,
    Tooltip,
    Typography,
    fp as _
} from 'apple-ui-components';

import {
    ActionsFooter,
    AlertSendType,
    DiscardChangesModal,
    EditIconButton,
    Notifier,
    alertStatusesEnum,
    alertTypes,
    alertsTypesLookUp,
    languageByLcId,
    languageLabel,
    subStatusesEnum,
    useAccess,
    useFeatureFlags,
    useNavigation
} from 'modules/Common';
import { alertsTranslations, commonTranslations, sharedTranslations } from 'translations';
import { permissionService } from 'services';

import { checkGlobalState, validateResponseOptions } from '../../utils';
import {
    AlertDetailsList,
    AlertMessagePreviewModal,
    AlertOptionCard,
    AlertsWarningModal,
    CreateAlertCard,
    CreateAlertSaveAsButton,
    CreateAlertTitle,
    CreateAlertsSendButton,
    DeliveryMethodsCount,
    MessageBodyRequiredModal,
    SaveAsTemplateDrawer,
    SendAlertModal,
    SendTemplate,
    SendTestAlertModal,
    Status
} from '../../components';
import { useModifyAlertAccess } from '../../hooks';

import './CreateAlert.scss';

// export let containsVariables = false;

// const containsVariables=alertDetails.alertMessage.en_US.all;

// string.includes('placeholder')

// const containsVariables = alertDetails.variables;

const CreateAlertTemplate = ({
    setAudienceType,
    setShowEditIcon,
    createAlertLookUp,
    keys,
    match,
    history,
    alertDeliveryMethods,
    saveAlert,
    saveAlertAsTemplate,
    sendAlert,
    blockedWarningModal,
    internalConferences,
    setAlertSendType,
    isContainTwitterInAlertMessages,
    isAlertMessageConfirmedByTwitterMethod,
    isAlertSendSuccess,
    isSendRestricted,
    areResponseOptionsRequired,
    isSendAlertDisabled,
    isSaveAlertDisabled,
    isSendTestDisabled,
    alertDetails,
    getAlertInformation,
    resetErrors,
    alertSendType,
    orgSettings,
    resetAlertDetails,
    setVariableValues,
    deliveryMethods,
    deliveryMethodsCount,
    recipientsInfo,
    responseOptions,
    isLoading,
    userInfo,
    alertType,
    restoreSelectedRecipients,
    blockWarningModal,
    isUnsavedAlertSendDisabled,
    divisions,
    userTimeZone,
    countryCodeList,
    getCountryCode,
    contactListActions, //trowing params needed fro AdditionalRecipientsControl.js component(!) that used redux to grab them
    addAdditionalRecipients,
    removeAdditionalRecipient,
    resetTopicByType,
    contacts,
    selectedContacts,
    selectedGroups,
    selectedSchedules,
    selectedTopics,
    additionalRecipients,
    disabledRecipients,
    restoreSelectedAdditionalRecipients,
    resetSelectedContacts,
    resetSelectedGroups,
    resetSelectedSchedules,
    organizationLocales,
    onCancel,
    redirectUrl,
    voiceProps,
    setAlertDetailsForceAddPublicFeedTabs,
    twitterAccounts,
    isTwitterMethodActive,
    canManageTwitter,
    orgFeatures,
    showEditIcon,
    audienceType,
    resetRecipientsInfo,
    clearRecipientsStorage,
    resetAddedTopics,
    lockBoxFileDetails,
    lockBoxFileDetailsLoading,
    getLockBoxFileDetailsRequested,
    resetLockBoxFileDetails,
    sentTemplateData
}) => {
    const intl = useIntl();
    const access = useAccess();
    const location = useLocation();
    const baseUrl = useNavigation();
    const { canViewGroups, canViewSchedule, canViewTopics, canViewContacts } = permissionService.permissions;

    const redirectTo = { redirectUrl: redirectUrl || baseUrl };
    const [isSendModalOpened, setSendModalOpened] = useState(false);
    const [isOpenDiscardModal, setDiscardModalOpened] = useState(false);
    const [isSendTestModalOpened, setSendTestModalOpened] = useState(false);
    const [isScheduleToSendModalOpened, setScheduleToSendModal] = useState(false);
    const [isSendTemplateDrawerOpened, setSendTemplateDrawerOpened] = useState(false);
    const [isSaveAsTemplateDrawerOpen, setSaveAsTemplateDrawerOpen] = useState(false);
    const [isPreviewMessageModalOpened, setPreviewMessageModalOpened] = useState(false);
    const [isMessageBodyRequiredModalOpened, setMessageBodyRequiredModalOpened] = useState(false);
    const saveAsTemplateFormRef = useRef(null);
    const variablesTemplateFormRef = useRef(null);
    const showMessageResponseOptions = !access.canManageNextGenSendingEngine();
    const restrictedAccessMsgRef = useRef(null);
    const mockedDeliveryMethodsWithoutText = 'Twitter';
    const { totalRecipients } = recipientsInfo;
    const { AddedRecipients, ScheduleToSendDrawer, SendAlertSuccess } = createAlertLookUp;
    const { alertName, loaded, senderInstructions, additionalRecipientsAllowed } = alertDetails;
    const templateInitialValues = { senderInstructions, allowAdditionalRecipients: additionalRecipientsAllowed };

    const [
        initiatorFormFeature,
        alertVariablesFeature,
        deliveryMethodsFeature,
        responseOptionsFeature,
        sendTestEnabled,
        saveAsTemplateFeature
    ] = useFeatureFlags([
        'initiatorForm',
        'alertVariables',
        'createAlertsPageDeliveryMethods',
        'createAlertsPageResponseOptions',
        'createAlertsPageSendTest',
        'createAlertsPageSaveAsTemplate'
    ]);

    useEffect(() => {
        restoreSelectedRecipients();
    }, []);

    useEffect(() => {
        const { alertId, alertStatus } = match.params;

        resetErrors();

        if (!loaded && alertId && alertStatus) {
            getAlertInformation(alertId, alertStatus);
        }
    }, []);

    useEffect(() => {
        if (_.isEmpty(countryCodeList)) {
            getCountryCode();
        }
    }, []);

    const canModifyAlert = useModifyAlertAccess();

    const canViewOnly = useMemo(() => {
        return access.canViewNotification() && !canModifyAlert;
    }, [access]);

    const canViewRecipients = useMemo(() => {
        const { canViewUsers, canViewGroups, canViewTopics } = access;

        return canViewUsers() || canViewGroups() || canViewTopics();
    }, []);

    const isSavedOrScheduledAlert = useCallback(() => {
        if (!location.state) {
            return false;
        }

        const checkAlertStatus = alertStatus =>
            alertStatus === alertStatusesEnum.saved || alertStatus === alertStatusesEnum.scheduled;

        const { alertStatus, alertType } = location.state;

        return alertStatus ? checkAlertStatus(alertStatus) : checkAlertStatus(alertType);
    }, [location]);

    const isTopicSubscriptionON = orgFeatures?.includes('topicSubscription');

    const shouldShowRestrictedAccessMsg = useMemo(() => {
        if (isTopicSubscriptionON) {
            return (
                isSavedOrScheduledAlert() &&
                (!canViewContacts() || !canViewGroups() || !canViewSchedule() || !canViewTopics())
            );
        }

        return isSavedOrScheduledAlert() && (!canViewContacts() || !canViewGroups() || !canViewSchedule());
    }, [permissionService.permissions, location.state, isTopicSubscriptionON]);

    const showRestrictedAccessMsg = useCallback(() => {
        Notifier.closeAll();
        Notifier.danger(
            <div ref={restrictedAccessMsgRef} tabIndex={-1} style={{ whiteSpace: 'normal' }}>
                <FormattedMessage {...alertsTranslations.ng_alerts_restrictedAccessNotification} />
            </div>
        );

        setTimeout(() => {
            DomUtils.setFocus(restrictedAccessMsgRef);
        }, 0);
    }, []);

    useEffect(() => {
        shouldShowRestrictedAccessMsg && showRestrictedAccessMsg();
    }, []);

    const isSendAvailable = useMemo(() => {
        if (isSendRestricted) {
            return false;
        }

        if (_.isEmpty(alertDetails)) {
            return true;
        }

        const { uuid: divisionUuid } = _.find(divisions, ({ id }) => id === alertDetails.alertDivision?.id) || {};
        const webInitiationNotification = access.canWebInitiationNotification();
        const canInitiateNotification = access.canInitiateNotification({
            divisions,
            resourceDivisions: divisionUuid
        });

        return webInitiationNotification && canInitiateNotification;
    }, [divisions, alertDetails, access]);

    const navigateTo = useCallback(
        pathname => () => {
            const { url, params } = match;
            const { alertId, alertStatus } = params;

            if (alertId && alertType) {
                history.push(`${baseUrl}/${alertStatus}/${alertId}/view/${pathname}`);
            } else {
                history.push(`${url}/${pathname}`, {
                    audienceType: location.state && location.state.audienceType
                });
            }
        },
        [history]
    );

    const onEdit = useCallback(() => {
        const { url, params } = match;
        const { alertId, alertStatus } = params;

        if (alertId && alertType) {
            history.push(`${baseUrl}/${alertStatus}/${alertId}/view/details`);
        } else {
            //history.push(`${baseUrl}/create/details`);
            history.push(`${url}/details`);
        }
    }, [history]);

    const toggleDiscardModal = useCallback(
        state => {
            setDiscardModalOpened(state);
            blockWarningModal(state);
        },
        [blockWarningModal]
    );

    const handleDiscard = useCallback(() => {
        toggleDiscardModal(false);
        if (isSendTemplateDrawerOpened || isSaveAsTemplateDrawerOpen) {
            setSendTemplateDrawerOpened(false);
            setSaveAsTemplateDrawerOpen(false);
        } else {
            resetAlertDetails();
            onCancel ? onCancel() : history.push(baseUrl);
        }
    }, [history, isSaveAsTemplateDrawerOpen, isSendTemplateDrawerOpened, onCancel]);

    const handleCancel = useCallback(() => {
        if (canViewOnly) {
            onCancel ? onCancel() : history.push(baseUrl);
        }

        const hasInfoToDiscard = checkGlobalState(keys);

        if (hasInfoToDiscard) {
            toggleDiscardModal(true);
            return;
        }

        if (onCancel) {
            onCancel();
            return;
        }
        history.push(baseUrl);
    }, [alertDetails, recipientsInfo, responseOptions, onCancel]);

    const showQuotaFormError = () => {
        Notifier.danger(intl.formatMessage(alertsTranslations.ng_alerts_responseOptionsQuotaError));
    };

    const validateQuotaFormData = useCallback(
        () => alertType !== alertTypes.QUOTA || _.some(responseOptions, x => x.success),
        [responseOptions, alertType]
    );

    // returns false if it's not valid
    const validateTwitterFormData = useCallback(
        alertDetails => {
            if (isContainTwitterInAlertMessages) {
                return !Object.values(alertDetails.alertMessage).some(messages => {
                    return (
                        messages?.twitter?.message?.length === 0 || messages?.twitter?.socialAccountsIDs?.length === 0
                    );
                });
            }

            // if twitter method is not active it returns true, otherwise check the message
            return !isTwitterMethodActive || (isTwitterMethodActive && isAlertMessageConfirmedByTwitterMethod);
        },
        [isAlertMessageConfirmedByTwitterMethod, isContainTwitterInAlertMessages, isTwitterMethodActive]
    );

    const handleCloseDiscardModal = useCallback(() => toggleDiscardModal(false), []);

    const showResponseOptionErrors = useCallback(errors => {
        const languages = _.map(Object.keys(errors), locale => languageLabel(languageByLcId(locale))).join(', ');

        ToastrProvider.danger(
            <FormattedMessage {...alertsTranslations.ng_alerts_responseOptionMissing} values={{ 0: languages }} />,
            {
                isAlwaysVisible: true
            }
        );
    }, []);

    const handleOptionsValidation = useCallback(() => {
        const { totalCount, errors } = validateResponseOptions(responseOptions);

        ToastrProvider.closeAll();

        if (totalCount) {
            showResponseOptionErrors(errors);
        }

        return totalCount;
    }, [showResponseOptionErrors, responseOptions]);

    const handleSendTestModalOpen = () => setSendTestModalOpened(true);

    var containsVariables = alertDetails.alertMessage.en_US.all.includes('placeholder');

    const handleSendNowModalOpen = () => {
        if (canManageTwitter && !validateTwitterFormData(alertDetails)) {
            setMessageBodyRequiredModalOpened(true);
            return;
        }

        if (handleOptionsValidation()) {
            return;
        }

        if (validateQuotaFormData()) {
            if (initiatorFormFeature && containsVariables(alertDetails)) {
                setSendTemplateDrawerOpened(true);
            } else {
                setSendModalOpened(true);
            }
            return;
        }
        showQuotaFormError();
    };

    const handleScheduleToSendModalOpen = useCallback(() => {
        if (canManageTwitter && !validateTwitterFormData(alertDetails)) {
            setMessageBodyRequiredModalOpened(true);
            return;
        }

        if (handleOptionsValidation()) {
            return;
        }

        if (validateQuotaFormData()) {
            setScheduleToSendModal(true);
        } else {
            showQuotaFormError();
        }
    }, [
        setScheduleToSendModal,
        setMessageBodyRequiredModalOpened,
        validateQuotaFormData,
        canManageTwitter,
        validateTwitterFormData,
        alertDetails
    ]);

    const handleSave = useCallback(() => {
        if (canManageTwitter && !validateTwitterFormData(alertDetails)) {
            setMessageBodyRequiredModalOpened(true);
            return;
        }

        if (!validateQuotaFormData()) {
            showQuotaFormError();
            return;
        }

        if (handleOptionsValidation()) {
            return;
        }

        saveAlert(redirectTo);
    }, [
        validateQuotaFormData,
        showQuotaFormError,
        handleOptionsValidation,
        validateTwitterFormData,
        redirectTo,
        saveAlert,
        alertDetails,
        canManageTwitter
    ]);

    const handleSaveAsDraft = () => {};

    const handleSaveAsTemplateOpen = () => {
        setSaveAsTemplateDrawerOpen(true);

        console.log('---->', alertDetails);
        console.log('---->', alertDetails.alertMessage.en_US);
        console.log('---->', typeof alertDetails.alertMessage.en_US.all);
        const check = alertDetails.alertMessage.en_US.all.includes('placeholder');
        console.log('It works');
        // export let containsVariables=false;

        // const checkVariable = () => {
        //     console.log('It works');
        //     containsVariables = AlertDetails.alertMessage.en_US.all.includes('placeholder');
        // };
    };

    const handleScheduleToSendModalCancel = () => setScheduleToSendModal(false);

    const handleScheduleToSendModalSchedule = () => setScheduleToSendModal(false);

    const handleSendNowModalCancel = () => setSendModalOpened(false);

    const handleModalMessageBodyRequired = () => {
        setAlertDetailsForceAddPublicFeedTabs(mockedDeliveryMethodsWithoutText);
        onEdit();
    };

    const handleMessageBodyRequiredCancel = () => {
        setMessageBodyRequiredModalOpened(false);
    };

    const handleSendTestModalCancel = () => setSendTestModalOpened(false);

    const onPreview = () => setPreviewMessageModalOpened(true);

    const onPreviewCancel = () => setPreviewMessageModalOpened(false);

    const handleModalSend = () => {
        sendAlert(AlertSendType.SEND_ONE_STEP, redirectTo);
        setSendModalOpened(false);
    };

    const handleModalSendTest = () => {
        setAlertSendType(AlertSendType.SEND_TEST);
        sendAlert(AlertSendType.SEND_TEST, redirectTo);
    };

    const handleSendTemplateDrawerSend = variableValues => {
        setVariableValues(variableValues.placeholders);
        sendAlert(AlertSendType.SEND_ONE_STEP, redirectTo);
        setSendTemplateDrawerOpened(false);
    };

    const handleSendTemplateDrawerClose = () => {
        if (
            variablesTemplateFormRef.current &&
            Object.keys(variablesTemplateFormRef.current.state.touched).length > 0
        ) {
            toggleDiscardModal(true);
            return;
        }
        setSendTemplateDrawerOpened(false);
    };

    const onAddedRecipientsClick = () => {
        const path = alertType ? `recipients/${alertsTypesLookUp[alertType].baseUrl}` : 'recipients';

        navigateTo(path)();
    };

    const handleSaveAsTemplateDrawerClose = () => {
        if (saveAsTemplateFormRef.current && Object.keys(saveAsTemplateFormRef.current.state.touched).length > 0) {
            toggleDiscardModal(true);
            return;
        }
        setSaveAsTemplateDrawerOpen(false);
    };

    const handleSaveAsTemplateDrawerSave = value => {
        saveAlertAsTemplate(value, redirectTo);
        setSaveAsTemplateDrawerOpen(false);
    };

    const isCompleted = useMemo(() => !_.isEmpty(alertDetails), [alertDetails]);
    const isSentAlert = useMemo(() => {
        const { alertId, alertStatus } = match.params;

        return alertStatus === alertStatusesEnum.sent && alertId;
    }, []);

    const discardChangesTitle = useMemo(() => {
        const message =
            isSendTemplateDrawerOpened || isSaveAsTemplateDrawerOpen
                ? {
                      id: 'discardTitle',
                      defaultMessage: 'Discard Changes'
                  }
                : alertsTranslations.ng_alerts_discardAlert;

        return <FormattedMessage {...message} />;
    }, [isSendTemplateDrawerOpened, isSaveAsTemplateDrawerOpen]);

    const discardChangesBody = useMemo(() => {
        const message =
            isSendTemplateDrawerOpened || isSaveAsTemplateDrawerOpen
                ? commonTranslations.ng_common_discardDescription
                : alertsTranslations.ng_alerts_discardAlertMessage;

        return <FormattedMessage {...message} />;
    }, [isSendTemplateDrawerOpened, isSaveAsTemplateDrawerOpen]);

    const isBulletinBoard = alertType === alertTypes.BULLETIN_BOARD;
    const isSmsOptIn = alertType === alertTypes.SMS_OPT_IN;
    const areResponseOptionsVisible = _.get(orgSettings.responseOptions, 'isVisible', false);

    const shouldDisableResponseOptionsForBulletinBoard = areResponseOptionsRequired
        ? false
        : isBulletinBoard && !areResponseOptionsVisible;
    const areDeliveryMethodsDisabled = isBulletinBoard || isSmsOptIn;

    const disabledDeliveryMethodsText = useMemo(() => {
        let deliveryMethodKey = alertsTranslations.ng_alerts_off;
        let deliveryMethodSubtext = alertsTranslations.ng_alerts_bulletinBoard;

        if (isSmsOptIn) {
            deliveryMethodKey = sharedTranslations.ng_shared_sms;
            deliveryMethodSubtext = alertsTranslations.ng_alerts_smsOptIn;
        }

        return (
            <>
                <Typography variant="p30" color="white">
                    <FormattedMessage {...deliveryMethodKey} />
                </Typography>
                <Typography variant="p14" color="white">
                    <FormattedMessage {...deliveryMethodSubtext} />
                </Typography>
            </>
        );
    }, [isBulletinBoard, isSmsOptIn]);

    return (
        <Page className="apple-alerts-create">
            <PageHeader
                title={
                    <CreateAlertTitle
                        resetAddedTopics={resetAddedTopics}
                        clearRecipientsStorage={clearRecipientsStorage}
                        resetRecipientsInfo={resetRecipientsInfo}
                        recipientsInfo={recipientsInfo}
                        audienceType={audienceType}
                        showEditIcon={showEditIcon}
                        alertTitle={alertDetails.isExistingAlert && alertDetails.alertName}
                        alertStatus={alertDetails.scheduledFor ? alertStatusesEnum.scheduled : alertDetails.status}
                        alertSubStatus={
                            containsVariables(alertDetails) ? subStatusesEnum.template : subStatusesEnum.saved
                        }
                        alertVariables={alertDetails.variables}
                        scheduledFor={alertDetails.scheduledFor}
                        userTimeZone={userTimeZone}
                        setAudienceType={setAudienceType}
                        setShowEditIcon={setShowEditIcon}
                    />
                }
            />
            {isAlertSendSuccess && alertSendType === AlertSendType.SCHEDULE_TO_SEND && <SendAlertSuccess />}
            {isAlertSendSuccess && alertSendType === AlertSendType.SEND_NOW ? <Redirect to={baseUrl} /> : null}
            {(!isAlertSendSuccess || alertSendType === AlertSendType.SEND_TEST) && !isLoading && (
                <>
                    <div className="apple-alerts-create__container">
                        <div className="apple-alerts-create__cards flex-grow-1 row">
                            <CreateAlertCard
                                className="col-12 col-sm-6"
                                imageClassName="apple-alerts-details"
                                title={intl.formatMessage(alertsTranslations.ng_alerts_alertDetails)}
                                description={intl.formatMessage(alertsTranslations.ng_alerts_alertDetailsDescription)}
                                onAddClick={navigateTo('details')}
                                handlerText={intl.formatMessage(alertsTranslations.ng_alerts_addAlertDetailsButton)}
                                details={alertDetails}
                                status={<Status className="mt-3 mb-0" completed={isCompleted} />}
                                content={
                                    isCompleted && (
                                        <Fragment>
                                            <AlertDetailsList
                                                organizationLocales={organizationLocales}
                                                alertVariablesFeature={alertVariablesFeature}
                                                onPreview={onPreview}
                                                userInfo={userInfo}
                                                {...alertDetails}
                                            />
                                            {canModifyAlert && (
                                                <EditIconButton
                                                    className="apple-alerts-create__edit-btn"
                                                    onClick={onEdit}
                                                />
                                            )}
                                        </Fragment>
                                    )
                                }
                            />
                            <CreateAlertCard
                                className="col-12 col-sm-6"
                                imageClassName="apple-alerts-recipients"
                                title={intl.formatMessage(commonTranslations.ng_common_recipients)}
                                description={intl.formatMessage(alertsTranslations.ng_alerts_recipientsDescription)}
                                onAddClick={canModifyAlert ? navigateTo('recipients') : () => {}}
                                handlerText={intl.formatMessage(alertsTranslations.ng_alerts_addRecipients)}
                                content={
                                    alertType && (
                                        <AddedRecipients
                                            disabled={!canViewRecipients && !canViewOnly}
                                            canModify={!canViewOnly}
                                            recipientsInfo={recipientsInfo}
                                            onEditClick={!canViewOnly ? onAddedRecipientsClick : null}
                                        />
                                    )
                                }
                                status={<Status className="mt-3 mb-0" completed={!_.isEmpty(recipientsInfo)} />}
                            />
                        </div>
                        <div className="apple-alerts-create__sub-cards row no-gutters">
                            {showMessageResponseOptions && (
                                <div className="col-12 col-sm px-1">
                                    <AlertOptionCard
                                        className="apple-alerts-create-options__response"
                                        disabled={shouldDisableResponseOptionsForBulletinBoard}
                                        title={intl.formatMessage(sharedTranslations.ng_shared_responseOptions)}
                                        info={
                                            shouldDisableResponseOptionsForBulletinBoard
                                                ? disabledDeliveryMethodsText
                                                : intl.formatMessage(
                                                      alertsTranslations.ng_alerts_responseOptionsExplanation
                                                  )
                                        }
                                        actions={
                                            responseOptionsFeature &&
                                            canModifyAlert && (
                                                <Button
                                                    color="secondary"
                                                    className="text-uppercase"
                                                    onClick={navigateTo('options')}
                                                >
                                                    <FormattedMessage {...sharedTranslations.ng_generic_add} />
                                                </Button>
                                            )
                                        }
                                        count={responseOptions.length}
                                        onEdit={responseOptionsFeature ? navigateTo('options') : null}
                                        icon={<MessageIcon color="white" size="4x" />}
                                        status={
                                            [alertTypes.QUOTA, alertTypes.SMS_OPT_IN].includes(alertType) ||
                                            areResponseOptionsRequired ? (
                                                <Status completed={responseOptions.length > 0} />
                                            ) : null
                                        }
                                    />
                                </div>
                            )}
                            {_.get(orgSettings.locationOverride, 'isVisible', false) && (
                                <div className="col-12 col-sm px-1">
                                    <AlertOptionCard
                                        className="apple-alerts-create-options__delivery"
                                        disabled={areDeliveryMethodsDisabled}
                                        title={intl.formatMessage(alertsTranslations.ng_alerts_deliveryMethods)}
                                        info={
                                            areDeliveryMethodsDisabled
                                                ? disabledDeliveryMethodsText
                                                : intl.formatMessage(
                                                      alertsTranslations.ng_alerts_deliveryMethodsExplanation
                                                  )
                                        }
                                        count={
                                            !areDeliveryMethodsDisabled && (
                                                <DeliveryMethodsCount deliveryMethods={alertDeliveryMethods} />
                                            )
                                        }
                                        actions={
                                            deliveryMethodsFeature &&
                                            canModifyAlert && (
                                                <Button
                                                    color="secondary"
                                                    className="text-uppercase"
                                                    onClick={navigateTo('delivery')}
                                                >
                                                    <FormattedMessage {...commonTranslations.ng_common_edit} />
                                                </Button>
                                            )
                                        }
                                        onEdit={deliveryMethodsFeature ? navigateTo('delivery') : null}
                                        icon={<PaperPlaneIcon color="white" size="4x" />}
                                        cardProps={{
                                            tabIndex: areDeliveryMethodsDisabled || !deliveryMethodsFeature ? -1 : 0,
                                            isDeliveryMethods: true
                                        }}
                                    />
                                </div>
                            )}
                            <div className="col-12 col-sm px-1">
                                <AlertOptionCard
                                    className="apple-alerts-create-options__advanced bg-gradient-grayish"
                                    title={intl.formatMessage(alertsTranslations.ng_alerts_advancedSettings)}
                                    info={intl.formatMessage(alertsTranslations.ng_alerts_advancedSettingsExplanation)}
                                    variant="dark"
                                    actions={
                                        canModifyAlert && (
                                            <Button
                                                color="secondary"
                                                className="text-uppercase"
                                                onClick={navigateTo('advanced')}
                                            >
                                                <FormattedMessage {...commonTranslations.ng_common_edit} />
                                            </Button>
                                        )
                                    }
                                    onEdit={navigateTo('advanced')}
                                    icon={<SettingsIcon color="white" size="4x" />}
                                />
                            </div>
                        </div>
                    </div>
                    <PaperFooter className="apple-alerts-create__footer">
                        <ActionsFooter
                            leftActions={
                                <Button
                                    variant="flat"
                                    color="primary"
                                    className="text-uppercase"
                                    onClick={handleCancel}
                                >
                                    {canViewOnly ? (
                                        <FormattedMessage {...commonTranslations.ng_common_back} />
                                    ) : (
                                        <FormattedMessage {...commonTranslations.ng_common_cancel} />
                                    )}
                                </Button>
                            }
                            rightActions={
                                <>
                                    {sendTestEnabled && isSendAvailable && !isSentAlert && (
                                        <Tooltip
                                            className="apple-alerts-create__tooltip"
                                            disableHover={!isSendTestDisabled}
                                            title={
                                                <FormattedMessage
                                                    {...alertsTranslations.ng_alerts_alertDetailsRequiredForTest}
                                                />
                                            }
                                            tabIndex={-1}
                                        >
                                            <div>
                                                <Button
                                                    color="secondary"
                                                    className="text-uppercase"
                                                    disabled={isSendTestDisabled}
                                                    onClick={handleSendTestModalOpen}
                                                >
                                                    {intl.formatMessage(commonTranslations.ng_common_sendTest)}
                                                </Button>
                                            </div>
                                        </Tooltip>
                                    )}
                                    {!isSentAlert && (
                                        <>
                                            {saveAsTemplateFeature && !canViewOnly && (
                                                <CreateAlertSaveAsButton
                                                    disabled={isSaveAlertDisabled}
                                                    isTemplate={containsVariables(alertDetails)}
                                                    onSave={handleSave}
                                                    onSaveAsDraft={handleSaveAsDraft}
                                                    onSaveAsTemplate={handleSaveAsTemplateOpen}
                                                />
                                            )}
                                            {isSendAvailable && (
                                                <CreateAlertsSendButton
                                                    showQuotaTooltip={alertType === alertTypes.QUOTA}
                                                    isExistingScheduledAlert={!!alertDetails.scheduledFor}
                                                    areResponseOptionsRequired={areResponseOptionsRequired}
                                                    disabled={isSendAlertDisabled}
                                                    onSendNow={handleSendNowModalOpen}
                                                    sendUnsavedDisabled={isUnsavedAlertSendDisabled}
                                                    isSendAlertDisabled={isSendAlertDisabled}
                                                    onScheduleToSend={handleScheduleToSendModalOpen}
                                                />
                                            )}
                                        </>
                                    )}
                                </>
                            }
                        />
                    </PaperFooter>
                </>
            )}
            {isOpenDiscardModal && (
                <DiscardChangesModal
                    isOpen={isOpenDiscardModal}
                    changesTitle={discardChangesTitle}
                    changesBody={discardChangesBody}
                    onClose={handleCloseDiscardModal}
                    onDiscard={handleDiscard}
                />
            )}
            {isSendTestModalOpened && (
                <SendTestAlertModal
                    isLoading={isLoading}
                    isOpen={isSendTestModalOpened}
                    isSuccess={isAlertSendSuccess}
                    onCancel={handleSendTestModalCancel}
                    onSend={handleModalSendTest}
                    userDevices={userInfo?.devices}
                />
            )}
            {isSendModalOpened && (
                <SendAlertModal
                    isOpen={isSendModalOpened}
                    onCancel={handleSendNowModalCancel}
                    onSend={handleModalSend}
                    alertName={alertName}
                    totalRecipients={totalRecipients}
                />
            )}
            {isMessageBodyRequiredModalOpened && (
                <MessageBodyRequiredModal
                    isOpen={isMessageBodyRequiredModalOpened}
                    onClose={handleMessageBodyRequiredCancel}
                    onEdit={handleModalMessageBodyRequired}
                    socialNetworkName={mockedDeliveryMethodsWithoutText}
                />
            )}
            {isPreviewMessageModalOpened && (
                <AlertMessagePreviewModal
                    isOpen={isPreviewMessageModalOpened}
                    alertDetails={alertDetails}
                    userInfo={userInfo}
                    onCancel={onPreviewCancel}
                    languages={organizationLocales}
                    voiceProps={voiceProps}
                    twitterAccounts={twitterAccounts}
                    orgFeatures={orgFeatures}
                    userTimeZone={userTimeZone}
                    lockBoxFileDetails={lockBoxFileDetails}
                    lockBoxFileDetailsLoading={lockBoxFileDetailsLoading}
                    getLockBoxFileDetailsRequested={getLockBoxFileDetailsRequested}
                    resetLockBoxFileDetails={resetLockBoxFileDetails}
                />
            )}

            {isScheduleToSendModalOpened && (
                <ScheduleToSendDrawer
                    isOpen={isScheduleToSendModalOpened}
                    onCancel={handleScheduleToSendModalCancel}
                    onSchedule={handleScheduleToSendModalSchedule}
                />
            )}

            {isSendTemplateDrawerOpened && (
                <SendTemplate
                    isOpen={isSendTemplateDrawerOpened}
                    onClose={handleSendTemplateDrawerClose}
                    onSendNow={handleSendTemplateDrawerSend}
                    organizationLocales={organizationLocales}
                    userInfo={userInfo}
                    alertType={alertType}
                    alertSettings={orgSettings}
                    alertDetails={alertDetails}
                    alertDeliveryMethods={alertDeliveryMethods}
                    deliveryMethods={deliveryMethods}
                    deliveryMethodsCount={deliveryMethodsCount}
                    internalConferences={internalConferences}
                    recipientsInfo={recipientsInfo}
                    responseOptions={responseOptions}
                    variablesTemplateRef={variablesTemplateFormRef}
                    contactListActions={contactListActions}
                    addAdditionalRecipients={addAdditionalRecipients}
                    removeAdditionalRecipient={removeAdditionalRecipient}
                    resetTopicByType={resetTopicByType}
                    contacts={contacts}
                    isLoading={isLoading}
                    selectedContacts={selectedContacts}
                    selectedGroups={selectedGroups}
                    selectedSchedules={selectedSchedules}
                    selectedTopics={selectedTopics}
                    additionalRecipients={additionalRecipients}
                    disabledRecipients={disabledRecipients}
                    restoreSelectedAdditionalRecipients={restoreSelectedAdditionalRecipients}
                    resetSelectedContacts={resetSelectedContacts}
                    resetSelectedGroups={resetSelectedGroups}
                    resetSelectedSchedules={resetSelectedSchedules}
                    {...sentTemplateData}
                />
            )}
            {isSaveAsTemplateDrawerOpen && (
                <SaveAsTemplateDrawer
                    isOpen={isSaveAsTemplateDrawerOpen}
                    onClose={handleSaveAsTemplateDrawerClose}
                    onSave={handleSaveAsTemplateDrawerSave}
                    initialValues={templateInitialValues}
                    saveAsTemplateRef={saveAsTemplateFormRef}
                />
            )}
            <AlertsWarningModal blockedWarningModal={blockedWarningModal} keys={keys} />
        </Page>
    );
};

CreateAlertTemplate.propTypes = {
    alertDeliveryMethods: PropTypes.object,
    alertDetails: PropTypes.object.isRequired,
    alertSendType: PropTypes.oneOf(Object.values(AlertSendType)),
    alertType: PropTypes.string,
    areResponseOptionsRequired: PropTypes.bool.isRequired,
    audienceType: PropTypes.string,
    blockWarningModal: PropTypes.func.isRequired,
    blockedWarningModal: PropTypes.bool.isRequired,
    canManageTwitter: PropTypes.bool,
    clearRecipientsStorage: PropTypes.func,
    countryCodeList: PropTypes.array.isRequired,
    deliveryMethods: PropTypes.object.isRequired,
    deliveryMethodsCount: PropTypes.number,
    divisions: PropTypes.array.isRequired,
    getAlertInformation: PropTypes.func.isRequired,
    getLockBoxFileDetailsRequested: PropTypes.func,
    internalConferences: PropTypes.array.isRequired,
    isAlertMessageConfirmedByTwitterMethod: PropTypes.bool,
    isAlertSendSuccess: PropTypes.bool,
    isContainTwitterInAlertMessages: PropTypes.bool,
    isLoading: PropTypes.bool,
    isSendAlertDisabled: PropTypes.bool.isRequired,
    isSendRestricted: PropTypes.bool,
    isSendTestDisabled: PropTypes.bool.isRequired,
    isTwitterMethodActive: PropTypes.bool,
    lockBoxFileDetails: PropTypes.object,
    lockBoxFileDetailsLoading: PropTypes.bool,
    match: PropTypes.object.isRequired,
    onCancel: PropTypes.func,
    orgFeatures: PropTypes.arrayOf(PropTypes.string),
    orgSettings: PropTypes.object,
    organizationLocales: PropTypes.array,
    recipientsInfo: PropTypes.object,
    redirectUrl: PropTypes.string,
    requestGroupContactCount: PropTypes.number,
    resetAddedTopics: PropTypes.func,
    resetAlertDetails: PropTypes.func.isRequired,
    resetErrors: PropTypes.func.isRequired,
    resetLockBoxFileDetails: PropTypes.func,
    resetRecipientsInfo: PropTypes.func,
    responseOptions: PropTypes.array.isRequired,
    saveAlertAsTemplate: PropTypes.func.isRequired,
    sentTemplateData: PropTypes.object,
    setAlertSendType: PropTypes.func.isRequired,
    setAudienceType: PropTypes.func.isRequired,
    setShowEditIcon: PropTypes.func.isRequired,
    showEditIcon: PropTypes.bool,
    twitterAccounts: PropTypes.array,
    userInfo: PropTypes.object.isRequired,
    userTimeZone: PropTypes.object.isRequired,
    voiceProps: PropTypes.object
};

export default CreateAlertTemplate;
