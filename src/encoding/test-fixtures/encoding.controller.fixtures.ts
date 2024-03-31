type EncodingControllerTestCase = {
  id: number;
  response: number;
};
export const GetEncodingByIdControllerCase: EncodingControllerTestCase[] = [
  {
    id: 1,
    response: 1,
  },
  {
    id: 2,
    response: 2,
  },
];

export const GetEncodingsControllerCase = [
  {
    status: 200,
    response: ['cool'],
  },
];

export const bitMovinWebHookPayloadCases = [
  {
    id: 'fb47150d-af6f-4ea5-b113-3a03a312d0eb',
    eventId: '433a5b9c-9fa2-47ed-bc10-dfe6e2d495eb',
    createdAt: '2024-03-29T07:06:06Z',
    modifiedAt: '2024-03-29T07:09:25Z',
    orgId: 'b83f05bf-06a4-45f9-8307-733f4fa0d74c',
    userId: '55624781-a497-420b-82f0-51568d50a8e3',
    notificationId: '6500b5bf-ade0-403e-8339-0d5685d7aab3',
    resourceId: '782c5b18-8743-4edc-8c5d-015f3f5b8f85',
    resourceType: 'ENCODING',
    type: 'WEBHOOK',
    eventType: 'ENCODING_STATUS_CHANGED',
    category: 'ENCODING',
    state: 'FIRED',
    triggeredAt: '2024-03-29T07:09:29.559376532Z',
    triggeredForResourceId: '782c5b18-8743-4edc-8c5d-015f3f5b8f85',
    internal: false,
    encodingStatus: {
      type: 'Encoding',
      progress: 0,
      status: 'RUNNING',
    },
    webhookId: '6500b5bf-ade0-403e-8339-0d5685d7aab3',
  },
];
