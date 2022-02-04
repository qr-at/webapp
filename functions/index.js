const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
admin.firestore().settings({ ignoreUndefinedProperties : true });

const getAttendanceData = async (email, section) => {
  const snapshot = await admin
    .firestore()
    .collection("attendance")
    .where("email", "==", email)
    .where("section", "==", section)
    .get();
  return snapshot.empty ? null : { ...snapshot.docs[0].data(), id: snapshot.docs[0].id };
};

exports.checkinAggregations = functions.firestore.document("/checkins/{id}")
  .onWrite(async (change, context) => {
    const oldData = change.before.exists ? change.before.data() : null; // null if new
    const newData = change.after.exists ? change.after.data() : null; // null if deleted

    if (!newData) return; // Deleted: Do nothing

    if (!oldData) {
      const curAtt = await getAttendanceData(newData.email, newData.section);
      if (curAtt) { // Update Attendance
        return await admin
          .firestore()
          .doc("/attendance/"+curAtt.id)
          .update({
            present: newData.present ? curAtt.present + 1 : curAtt.present,
            excused: newData.excused ? curAtt.excused + 1 : curAtt.excused,
            lastAttended: newData.present ? newData.date : curAtt.lastAttended,
          });
      } else { // Create Attendance
        return await admin
          .firestore()
          .collection("attendance")
          .add({
            email: newData.email,
            section: newData.section,
            excused: newData.excused ? 1 : 0,
            present: newData.present ? 1 : 0,
            lastAttended: newData.present ? newData.date : null,
          });
      }
    }

    const curAtt = await getAttendanceData(newData.email, newData.section);
    const jCIDate = new Date(newData.date+"T12:00:00");
    const jAttDate = new Date(curAtt.lastAttended+"T12:00:00");
    await admin
      .firestore()
      .doc("/attendance/"+curAtt.id)
      .update({
        excused: oldData.excused != newData.excused ? (newData.excused ? curAtt.excused + 1 : curAtt.excused - 1) : curAtt.excused,
        present: oldData.present != newData.present ? (newData.present ? curAtt.present + 1 : curAtt.present - 1) : curAtt.present,
        lastAttended: (newData.present && !curAtt.lastAttended) || jCIDate >= jAttDate ? newData.date : curAtt.lastAttended,
      });
  });
