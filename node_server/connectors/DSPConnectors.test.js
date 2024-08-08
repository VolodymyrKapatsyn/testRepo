//DSPConnectors.js unit testing
const path = require('path');

jest.mock(require.resolve(__dirname, '../configs/config.json'), () => ({
    company_suffix: '_mock_suffix',
}));

jest.mock('../modules/native/index.js', () => ({
    getNativeForDSP: jest.fn().mockReturnValue('nativeRequest')
}));

const mockProcessByCompany = jest.fn();
const mockProcessByDSPId = jest.fn();
const mockProcessByEndpointName = jest.fn();

jest.mock('./DSPConnectors.js', () => {
    const actualModule = jest.requireActual('./DSPConnectors.js');
    return {
        ...actualModule,
        _proccessByCompany: mockProcessByCompany,
        _proccessByDSPId: mockProcessByDSPId,
        _proccessByEndpointName: mockProcessByEndpointName
    };
});

const { modifyPrebidRequest, checkDSPRequestRequirements, modifyFinalRequest } = require('./DSPConnectors.js');

global.globalStorage = {
    dspPartners: {
        sovrn: { company: 'sovrn' },
        mock: { company: 'mock' },
        other: { company: 'other' },
        testDSP: {
            nativeSpec: 'testSpec',
            at: 1,
            company: 'testCompany',
            id: 'testId'
        }
    }
};

describe('checkDSPRequestRequirements', () => {
    it('should return "dspConnector" for sovrn when bidRequest.regs.coppa >= 1', () => {
        const result = checkDSPRequestRequirements('sovrn', { regs: { coppa: 1 } }, {}, '');
        expect(result).toBe('dspConnector');
    });

    it('should return "dspConnector" for mock when bidRequest.regs.coppa >= 1', () => {
        const result = checkDSPRequestRequirements('mock', { regs: { coppa: 1 } }, {}, '');
        expect(result).toBe('dspConnector');
    });

    it('should return empty string for sovrn when bidRequest.regs.coppa < 1', () => {
        const result = checkDSPRequestRequirements('sovrn', { regs: { coppa: 0 } }, {}, '');
        expect(result).toBe('');
    });

    it('should return empty string for other DSP companies', () => {
        const result = checkDSPRequestRequirements('other', { regs: { coppa: 1 } }, {}, '');
        expect(result).toBe('');
    });
});

describe('modifyPrebidRequest', () => {
    it('should modify the request and return it when ext is set', () => {
        const request = { imp: [{ ext: null }] };
        const dspModel = { prebidPayload: { someKey: 'someValue' } };
        const type = 'someType';
        const size = 'someSize';
        const isCTV = false;

        const modifiedRequest = modifyPrebidRequest(request, dspModel, type, size, isCTV);

        expect(modifiedRequest).toEqual({
            imp: [{ ext: { someKey: 'someValue' } }]
        });
    });

    it('should return false when ext is not set', () => {
        const request = { imp: [{ ext: null }] };
        const dspModel = { prebidPayload: null }; // В этом случае ext не будет установлен
        const type = 'someType';
        const size = 'someSize';
        const isCTV = false;

        const result = modifyPrebidRequest(request, dspModel, type, size, isCTV);

        expect(result).toBe(false);
    });

    it('should not modify other parts of the request', () => {
        const request = {
            imp: [{ ext: null }],
            someOtherField: 'someValue'
        };
        const dspModel = { prebidPayload: { someKey: 'someValue' } };
        const type = 'someType';
        const size = 'someSize';
        const isCTV = false;

        const modifiedRequest = modifyPrebidRequest(request, dspModel, type, size, isCTV);

        expect(modifiedRequest).toEqual({
            imp: [{ ext: { someKey: 'someValue' } }],
            someOtherField: 'someValue'
        });
    });
});

describe('modifyFinalRequest', () => {
    let finalRequestObject;
    let placementParams;
    let request;
    let headers;
    let requestsByNativeSpec;

    beforeEach(() => {
        finalRequestObject = {
            imp: [
                {
                    native: {
                        request: ''
                    }
                }
            ]
        };
        placementParams = {};
        request = { imp: [{ native: {} }] };
        headers = {};
        requestsByNativeSpec = {};
    });

    it('should modify the final request with native spec if type is "native"', () => {
        const dspName = 'testDSP';
        const sspPartner = 'testSSP';
        const platformType = 'desktop';
        const source = 'testSource';
        const type = 'native';
        const isCTV = false;
        const size = '300x250';

        const result = modifyFinalRequest(dspName, sspPartner, placementParams, finalRequestObject, platformType, request, source, type, isCTV, size, headers, requestsByNativeSpec);

        expect(result.imp[0].native.request).toBe('nativeRequest');
        expect(result.at).toBe(1);
        expect(mockProcessByCompany).toHaveBeenCalledWith(result, 'testCompany', headers, platformType);
        expect(mockProcessByDSPId).toHaveBeenCalledWith(result, 'testId');
        expect(mockProcessByEndpointName).toHaveBeenCalledWith(result, dspName, size, headers, platformType, type);
    });

    it('should return false if native spec request is undefined', () => {
        const dspName = 'testDSP';
        const sspPartner = 'testSSP';
        const platformType = 'desktop';
        const source = 'testSource';
        const type = 'native';
        const isCTV = false;
        const size = '300x250';

        requestsByNativeSpec = { 'testSpec': false };

        const result = modifyFinalRequest(dspName, sspPartner, placementParams, finalRequestObject, platformType, request, source, type, isCTV, size, headers, requestsByNativeSpec);

        expect(result).toBe(false);
    });

    it('should not modify native request if type is not "native"', () => {
        const dspName = 'testDSP';
        const sspPartner = 'testSSP';
        const platformType = 'desktop';
        const source = 'testSource';
        const type = 'display';
        const isCTV = false;
        const size = '300x250';

        const result = modifyFinalRequest(dspName, sspPartner, placementParams, finalRequestObject, platformType, request, source, type, isCTV, size, headers, requestsByNativeSpec);

        expect(result.imp[0].native.request).toBe('');
        expect(result.at).toBe(1);
        expect(mockProcessByCompany).toHaveBeenCalledWith(result, 'testCompany', headers, platformType);
        expect(mockProcessByDSPId).toHaveBeenCalledWith(result, 'testId');
        expect(mockProcessByEndpointName).toHaveBeenCalledWith(result, dspName, size, headers, platformType, type);
    });
});
