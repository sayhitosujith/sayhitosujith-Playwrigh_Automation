Feature: Naukri Login and Profile Validation

  @smoke @naukri
  Scenario: Login to Naukri and validate profile
    Given I navigate to the Naukri login page
    When I login with valid credentials
    And I navigate to the profile page
    And I update the resume headline
    And I optionally upload the resume
    Then I should logout successfully
