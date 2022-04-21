const Pool = require("pg").Pool;
const pool = new Pool({ // create connection to database
  connectionString: "postgres://xstdarsoblpeui:85cf00a627b12bdad0298ee99cc62d9a3c303a41fb3cb5616b7238395950da13@ec2-3-217-251-77.compute-1.amazonaws.com:5432/dadc39d7bnrul4",	// use DATABASE_URL environment variable from Heroku app 
  ssl: {
    rejectUnauthorized: false // don't check for SSL cert
  }
});

const getAllEmployees = async (request, response) => {
  const emp_details = await getAllEmployeesDetails();
  const emp_dept = await getAllEmpDeptRelations();
  const dept_details = await getDepartmentDeatils();
  let emp_deptIndex = 0,
    empIndex = 0;
  emp_details.forEach((emp) => (emp.department = []));
  while (emp_deptIndex < emp_dept.length) {
    while (
      emp_deptIndex < emp_dept.length &&
      emp_details[empIndex].empid == emp_dept[emp_deptIndex].emp_id
    ) {
      emp_details[empIndex].department.push(
        dept_details.find(
          (dept) => dept.dept_id == emp_dept[emp_deptIndex].dept_id
        ).name
      );
      emp_deptIndex++;
    }
    empIndex++;
  }
  response.status(200).json(emp_details);
};
const getAllEmployeesDetails = () => {
  return new Promise((resolve, reject) => {
    pool.query(
      "SELECT emp_id as empid, name, email, phone, salary FROM emp_details ORDER BY emp_id ASC",
      (error, results) => {
        if (error) {
          return reject(error);
        }
        resolve(results.rows);
      }
    );
  });
};
const getAllEmpDeptRelations = () => {
  return new Promise((resolve, reject) => {
    pool.query(
      "SELECT * FROM emp_dept ORDER BY emp_id ASC",
      (error, results) => {
        if (error) {
          return reject(error);
        }
        resolve(results.rows);
      }
    );
  });
};
const getDepartmentDeatils = () => {
  return new Promise((resolve, reject) => {
    pool.query(
      "SELECT * FROM dept_details ORDER BY dept_id ASC",
      (error, results) => {
        if (error) {
          return reject(error);
        }
        resolve(results.rows);
      }
    );
  });
};

const getEmployeeById = async (request, response) => {
  const emp_id = parseInt(request.params.emp_id);
  let emp_details = await getEmployeeDetailsById(emp_id);
  const emp_dept = await getEmpDeptRelations(emp_id);
  const dept_details = await getDepartmentDeatils();
  emp_details.department = [];
  for(let i=0;i<emp_dept.length;i++){
    emp_details.department.push(
      dept_details.find(
        (dept) => dept.dept_id == emp_dept[i].dept_id
      ).name
    );
  }
  response.status(200).json(emp_details);
};
const getEmployeeDetailsById = (emp_id) => {
  return new Promise((resolve, reject) => {
    pool.query(
      "SELECT emp_id as empid, name, email, phone, salary FROM emp_details where emp_id = $1",
      [ emp_id ],
      (error, results) => {
        if (error) {
          return reject(error);
        }
        resolve(results.rows[0]);
      }
    );
  });
};
const getEmpDeptRelations = ( emp_id ) => {
  return new Promise((resolve, reject) => {
    pool.query(
      "SELECT * FROM emp_dept where emp_id = $1",
      [ emp_id ],
      (error, results) => {
        if (error) {
          return reject(error);
        }
        resolve(results.rows);
      }
    );
  });
};

const addEmployee = async (request, response) => {
  const { name, email, phone, salary, department } = request.body;
  await addEmployeeDetails(name, email, phone, salary);
  const emp_id= await getEmployeeId(email);
  for(let i=0; i<department.length ; i++){
    await addEmployeeDepartment(emp_id, department[i]);
  }
  response.status(201).json({"empid": emp_id});
};
const addEmployeeDetails = (name, email, phone, salary) => {
  return new Promise((resolve, reject) => {
    pool.query(
      "INSERT INTO emp_details (name, email, phone, salary) VALUES ($1, $2, $3, $4)",
      [name, email, phone, salary],
      (error, results) => {
        if (error) {
          return reject(error);
        }
        resolve(results);
      }
    );
  });
};
const getEmployeeId = ( email ) => {
  return new Promise((resolve, reject) => {
    pool.query(
      "Select emp_id from emp_details where email = $1",
      [email],
      (error, results) => {
        if (error) {
          return reject(error)
        }
        resolve(results.rows[0].emp_id);
      }
    );
  })
}
const addEmployeeDepartment = ( emp_id, dept_id ) => {
  return new Promise((resolve, reject) => {
    pool.query(
      "INSERT INTO emp_dept ( emp_id, dept_id ) VALUES ($1, $2)",
      [emp_id, dept_id],
      (error, results) => {
        if (error) {
          return reject(error);
        }
        resolve(results);
      }
    );
  })
}

const updateEmployee = async (request, response) => {
  const emp_id = parseInt(request.params.emp_id);
  const { name, email, phone, salary, department } = request.body;
  await updateEmployeeDetails(emp_id, name, email, phone, salary);
  if(await deleteEmployeeDepartments(emp_id))
  for(let i=0; i<department.length ; i++){
    await addEmployeeDepartment(emp_id, department[i]);
  }
  response.status(201).json({"msg": "Record Updated"});
};
const updateEmployeeDetails = (emp_id, name, email, phone, salary) => {
  return new Promise((resolve, reject) => {
    pool.query(
      "UPDATE emp_details SET name = $1, email = $2, phone = $3, salary = $4 WHERE emp_id = $5",
      [name, email, phone, salary, emp_id],
      (error, results) => {
        if (error) {
          return reject(error);
        }
        resolve(results);
      }
    );
  });
};
const deleteEmployeeDepartments = (emp_id ) => {
  return new Promise((resolve, reject) => {
    pool.query(
      "DELETE FROM emp_dept WHERE emp_id = $1",
      [emp_id],
      (error, results) => {
        if (error) {
          return reject(error);
        }
        resolve(true);
      }
    );
  });
};

const deleteEmployee = async (request, response) => {
  const emp_id = parseInt(request.params.emp_id);
  await deleteEmployeeDetails(emp_id);
  await deleteEmployeeDepartments(emp_id);
  response.status(200).json({"msg": "Record Deleted"});
};
const deleteEmployeeDetails = (emp_id ) => {
  return new Promise((resolve, reject) => {
    pool.query(
      "DELETE FROM emp_details WHERE emp_id = $1",
      [emp_id],
      (error, results) => {
        if (error) {
          return reject(error);
        }
        resolve(true);
      }
    );
  });
};

module.exports = {
  getAllEmployees,
  getEmployeeById,
  addEmployee,
  updateEmployee,
  deleteEmployee,
};
