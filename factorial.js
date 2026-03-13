// write a function to calculate the factorial of a number in JavaScript.
function factorial(n) {
    if (n < 0) {
        return "Factorial is not defined for negative numbers.";
    } else if (n === 0 || n === 1) {
        return 1;
    } else {
        let result = 1;
        for (let i = 2; i <= n; i++) {
            result *= i;
        }
        return result;
    }
}

// Example usage:
console.log(factorial(5)); // Output: 120
console.log(factorial(0)); // Output: 1
console.log(factorial(-3)); // Output: "Factorial is not defined for negative numbers."

// Now, let's create a class named Invoice with amount, dueDate, and customerName properties. 
// Include a method to calculate the total amount with tax.

// create a class named Invoice with amount, dueDate, and customerName properties. Include a method to calculate the total amount with tax.
class Invoice {
    constructor(amount, dueDate, customerName) {
        this.amount = amount;
        this.dueDate = dueDate;
        this.customerName = customerName;
    }

    calculateTotalWithTax(taxRate) {
        return this.amount + (this.amount * taxRate);
    }
}

// Example usage:
const invoice = new Invoice(100, '2024-12-31', 'John Doe');
console.log(invoice.calculateTotalWithTax(0.1)); // Output: 110 

// add utility function to format date as MM/DD/YYYY
function formatDate(date) {
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    return `${month}/${day}/${year}`;
}

// Example usage:
console.log(formatDate('2024-12-31')); // Output: "12/31/2024"

function addUser(user) {
    // Explain what this function does and how it works and list its parameters and return value.
    // This function takes a user object as a parameter and adds it to a database (simulated here with an array).
    // It first validates the user input to ensure that the user has a name and email. If the validation fails, it returns an error message.
    // If the validation passes, it adds the user to the database and returns a success message.

    // Parameters:
    // - user: an object that should have 'name' and 'email' properties.

    // Return value:
    // - A string message indicating whether the user was added successfully or if there was an error with the input.  


    //validate user input
    if (!user.name || !user.email) {
        return "User must have a name and email.";
    }
    //add user to database (simulated here with an array)
    const users = [];
    users.push(user);
    return "User added successfully.";
}

// I would like to create a blocker for a Consignment that is being created in the system. The blocker should prevent the consignment from being created if the user does not have the necessary permissions.

function createConsignment(user) {
    // This function checks if the user has the necessary permissions to create a consignment. If the user does not have the required permissions, it returns an error message. If the user has the necessary permissions, it proceeds to create the consignment and returns a success message.

    // Parameters:
    // - user: an object that should have a 'permissions' property, which is an array of permission strings.

    // Return value:
    // - A string message indicating whether the consignment was created successfully or if there was an error due to insufficient permissions.

    const requiredPermission = "CREATE_CONSIGNMENT";
    
    if (!user.permissions || !user.permissions.includes(requiredPermission)) {
        return "Error: You do not have the necessary permissions to create a consignment.";
    }
    
    // Code to create the consignment would go here (not implemented in this example)
}

// Validate an email address and return true if valid
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Example usage:
console.log(validateEmail('user@example.com'));  // Output: true
console.log(validateEmail('invalid-email'));      // Output: false

module.exports = { factorial, Invoice, formatDate, addUser, createConsignment, validateEmail };           