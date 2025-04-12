// src/__tests__/MultiStepRegistration.test.jsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MultiStepRegistration from '../pages/MultiStepRegistration';
import { MemoryRouter } from 'react-router-dom';

// Each mocked component must be exported as default.
vi.mock('../components/registration/BasicInfo', () => {
  return {
    default: (props) => (
      <div data-testid="basic-info">
        Basic Info Step
        <button data-testid="basic-next" onClick={props.nextStep}>Next</button>
      </div>
    ),
  };
});

vi.mock('../components/registration/PersonalDetails', () => {
  return {
    default: (props) => (
      <div data-testid="personal-details">
        Personal Details Step
        <button data-testid="personal-next" onClick={props.nextStep}>Next</button>
        <button data-testid="personal-prev" onClick={props.prevStep}>Prev</button>
      </div>
    ),
  };
});

vi.mock('../components/registration/DietaryPreference', () => {
  return {
    default: (props) => (
      <div data-testid="dietary-preference">
        Dietary Preference Step
        <button data-testid="dietary-next" onClick={props.nextStep}>Next</button>
        <button data-testid="dietary-prev" onClick={props.prevStep}>Prev</button>
      </div>
    ),
  };
});

vi.mock('../components/registration/HealthConditions', () => {
  return {
    default: (props) => (
      <div data-testid="health-conditions">
        Health Conditions Step
        <button data-testid="health-prev" onClick={props.prevStep}>Prev</button>
        <button data-testid="health-submit" onClick={() => props.handleSubmit()}>Submit</button>
      </div>
    ),
  };
});

describe('MultiStepRegistration Component', () => {
  test('initially renders the BasicInfo step', () => {
    render(
      <MemoryRouter>
        <MultiStepRegistration />
      </MemoryRouter>
    );
    // Verify that BasicInfo is rendered initially.
    expect(screen.getByTestId('basic-info')).toBeInTheDocument();
    expect(screen.queryByTestId('personal-details')).toBeNull();
  });

  test('transitions correctly between steps', async () => {
    render(
      <MemoryRouter>
        <MultiStepRegistration />
      </MemoryRouter>
    );

    // Initially, BasicInfo should be visible.
    expect(screen.getByTestId('basic-info')).toBeInTheDocument();

    // Click the next button in BasicInfo to transition to PersonalDetails.
    await userEvent.click(screen.getByTestId('basic-next'));
    expect(screen.getByTestId('personal-details')).toBeInTheDocument();

    // Click next in PersonalDetails to move to DietaryPreference.
    await userEvent.click(screen.getByTestId('personal-next'));
    expect(screen.getByTestId('dietary-preference')).toBeInTheDocument();

    // Click next in DietaryPreference to move to HealthConditions.
    await userEvent.click(screen.getByTestId('dietary-next'));
    expect(screen.getByTestId('health-conditions')).toBeInTheDocument();

    // Test going back: click Prev in HealthConditions should return to DietaryPreference.
    await userEvent.click(screen.getByTestId('health-prev'));
    expect(screen.getByTestId('dietary-preference')).toBeInTheDocument();

    // Click Prev in DietaryPreference to go back to PersonalDetails.
    await userEvent.click(screen.getByTestId('dietary-prev'));
    expect(screen.getByTestId('personal-details')).toBeInTheDocument();
  });
});
