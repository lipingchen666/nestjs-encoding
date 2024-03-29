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
