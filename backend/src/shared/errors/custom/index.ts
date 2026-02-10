export type ErrorMessage = {
    en: string;
    ar: string;
};

export const ErrorCodes = {
    auth: {
        wrongCredentials: 'auth-wrongCredentials',
        userAlreadyExist: 'auth-userAlreadyExist',
        userNotFound: 'auth-userNotFound',
        usernameAlreadyExist: 'auth-usernameAlreadyExist',
        userNotActive: 'auth-userNotActive',
    },
    user: {
        emailAlreadyExist: 'user-emailAlreadyExist',
        notFound: 'user-notFound',
        usernameAlreadyExist: 'user-usernameAlreadyExist',
    },
    global: {
        internalError: 'global-internalError',
    },

    label: {
        nameAlreadyExist: 'label-nameAlreadyExist',
    },
    knowledgeBase: {
        notFound: 'knowledgeBase-notFound',
        nameAlreadyExist: 'knowledgeBase-nameAlreadyExist',
        aiServiceError: 'knowledgeBase-aiServiceError',
    },
    knowledgeBaseFile: {
        notFound: 'knowledgeBaseFile-notFound',
        noDefaultConfig: 'knowledgeBaseFile-noDefaultConfig',
        fileNotFound: 'knowledgeBaseFile-fileNotFound',
    },
    knowledgeBaseFileChunk: {
        notFound: 'knowledgeBaseFileChunk-notFound',
    },
    usersGroup: {
        notFound: 'usersGroup-notFound',
        nameAlreadyExist: 'usersGroup-nameAlreadyExist',
        usersNotFound: 'usersGroup-usersNotFound',
    },
    assistant: {
        notFound: 'assistant-notFound',
        nameAlreadyExist: 'assistant-nameAlreadyExist',
    },
};

export const errorMessagesMapper = {
    // global
    [`${ErrorCodes.global.internalError}`]: {
        en: 'something went wrong',
        ar: 'حدث خطأ ما',
    },

    // auth
    [`${ErrorCodes.auth.wrongCredentials}`]: {
        en: 'wrong data provided',
        ar: 'معلومات خاطئة',
    },
    [`${ErrorCodes.auth.userAlreadyExist}`]: {
        en: 'user already exist',
        ar: 'هذا المستخدم موجود بالفعل',
    },
    [`${ErrorCodes.auth.userNotFound}`]: {
        en: 'The user was not found',
        ar: 'لم يتم العثور على المستخدم',
    },
    [`${ErrorCodes.auth.usernameAlreadyExist}`]: {
        en: 'This username already exists',
        ar: 'اسم المستخدم موجود بالفعل',
    },
    [`${ErrorCodes.auth.userNotActive}`]: {
        en: 'The user is not active',
        ar: 'المستخدم غير مفعل',
    },
    // user
    [`${ErrorCodes.user.emailAlreadyExist}`]: {
        en: 'email already in use',
        ar: 'هذا البريد الإلكتروني مستخدم بالفعل',
    },
    [`${ErrorCodes.user.notFound}`]: {
        en: 'user not found',
        ar: 'لم يتم العثور على المستخدم',
    },
    [`${ErrorCodes.user.usernameAlreadyExist}`]: {
        en: 'username already in use',
        ar: 'اسم المستخدم مستخدم بالفعل',
    },
    // label
    [`${ErrorCodes.label.nameAlreadyExist}`]: {
        en: 'there is a label with the same name',
        ar: 'هذا الاسم مستخدم بالفعل',
    },

    // knowledge base
    [`${ErrorCodes.knowledgeBase.notFound}`]: {
        en: 'knowledge base not found',
        ar: 'القاعدة المعرفية لم يتم العثور عليها',
    },
    [`${ErrorCodes.knowledgeBase.nameAlreadyExist}`]: {
        en: 'knowledge base name already exists',
        ar: 'اسم القاعدة المعرفية مستخدم بالفعل',
    },
    [`${ErrorCodes.knowledgeBase.aiServiceError}`]: {
        en: 'AI service error occurred',
        ar: 'حدث خطأ في خدمة الذكاء الاصطناعي',
    },

    // knowledge base file
    [`${ErrorCodes.knowledgeBaseFile.notFound}`]: {
        en: 'knowledge base file not found',
        ar: 'الملف المعرفي لم يتم العثور عليه',
    },
    [`${ErrorCodes.knowledgeBaseFile.noDefaultConfig}`]: {
        en: 'no default config for this file type',
        ar: 'لا يوجد إعدادات إفتراضية لهذا النوع من الملفات',
    },
    [`${ErrorCodes.knowledgeBaseFile.fileNotFound}`]: {
        en: 'file not found in knowledge base file',
        ar: 'الملف غير موجود في القاعدة المعرفية',
    },

    // knowledge base file chunk
    [`${ErrorCodes.knowledgeBaseFileChunk.notFound}`]: {
        en: 'knowledge base file chunk not found',
        ar: 'القسم المعرفي لم يتم العثور عليه',
    },

    // users groups
    [`${ErrorCodes.usersGroup.notFound}`]: {
        en: 'users group not found',
        ar: 'مجموعة المستخدمين لم يتم العثور عليها',
    },
    [`${ErrorCodes.usersGroup.nameAlreadyExist}`]: {
        en: 'users group name already exists',
        ar: 'اسم مجموعة المستخدمين مستخدم بالفعل',
    },
    [`${ErrorCodes.usersGroup.usersNotFound}`]: {
        en: 'some users do not exist',
        ar: 'بعض المستخدمين غير موجودين',
    },
    // assistant
    [`${ErrorCodes.assistant.notFound}`]: {
        en: 'assistant not found',
        ar: 'المساعد لم يتم العثور عليه',
    },
    [`${ErrorCodes.assistant.nameAlreadyExist}`]: {
        en: 'assistant name already exists',
        ar: 'اسم المساعد مستخدم بالفعل',
    },
};
