// Test script to debug teacher creation issue
// Run this in browser console to test the API directly

async function testTeacherCreation() {
  const token = localStorage.getItem('access_token');
  
  if (!token) {
    console.error('No access token found. Please login first.');
    return;
  }

  // Minimal test data that should work
  const testData = {
    first_name: "Test",
    last_name: "Teacher",
    email: `test.teacher.${Date.now()}@school.com`, // Unique email
    password: "testpassword123", // 8+ characters
    role: "teacher",
    employee_id: `TCH${Date.now()}`, // Unique employee ID
    department: "Mathematics",
    position: "Teacher"
  };

  console.log('Testing with data:', testData);

  try {
    const response = await fetch('/api/v1/users/staff', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(testData),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const responseData = await response.text();
    console.log('Response body:', responseData);

    if (!response.ok) {
      console.error('Request failed with status:', response.status);
      try {
        const errorData = JSON.parse(responseData);
        console.error('Error details:', errorData);
      } catch (e) {
        console.error('Could not parse error response as JSON');
      }
    } else {
      console.log('Success! Teacher created.');
      try {
        const successData = JSON.parse(responseData);
        console.log('Created teacher:', successData);
      } catch (e) {
        console.log('Response is not JSON');
      }
    }
  } catch (error) {
    console.error('Network error:', error);
  }
}

// Run the test
console.log('Starting teacher creation test...');
testTeacherCreation();
